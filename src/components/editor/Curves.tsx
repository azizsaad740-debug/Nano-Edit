import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { Point, EditState } from '@/hooks/useEditorState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type Channel = keyof EditState['curves'];

interface CurvesProps {
  curves: EditState['curves'];
  onChange: (channel: Channel, points: Point[]) => void;
  onCommit: (channel: Channel, points: Point[]) => void;
  imgRef: React.RefObject<HTMLImageElement>;
}

const SIZE = 256;
const PADDING = 10;
const GRAPH_SIZE = SIZE - PADDING * 2;

const Curves = ({ curves, onChange, onCommit, imgRef }: CurvesProps) => {
  const [activeChannel, setActiveChannel] = useState<Channel>('all');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(100); // 0 to 200
  const svgRef = useRef<SVGSVGElement>(null);
  const [histogramData, setHistogramData] = useState<number[]>(new Array(256).fill(0));

  const points = curves[activeChannel];

  useEffect(() => {
    const imageElement = imgRef.current;
    if (!imageElement || !imageElement.complete || imageElement.naturalWidth === 0) {
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const luminanceBins = new Array(256).fill(0);

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      luminanceBins[luminance]++;
    }
    setHistogramData(luminanceBins);
  }, [imgRef, imgRef.current?.src]);

  const getSVGCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Calculate coordinates relative to the SVG viewBox (0 to SIZE)
    const x = (e.clientX - rect.left) * (SIZE / rect.width);
    const y = (e.clientY - rect.top) * (SIZE / rect.height);
    
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent | MouseEvent, index: number | null) => {
    e.stopPropagation();
    
    if (index !== null) {
      setDraggingIndex(index);
    } else {
      // Add new point if clicking inside the graph area
      const { x, y } = getSVGCoords(e);
      if (x > PADDING && x < SIZE - PADDING && y > PADDING && y < SIZE - PADDING) {
        // Convert SVG coordinates back to 0-255 range for storage
        const newX = Math.round(((x - PADDING) / GRAPH_SIZE) * 255);
        const newY = Math.round(255 - ((y - PADDING) / GRAPH_SIZE) * 255);
        
        const newPoint: Point = { x: newX, y: newY };
        
        const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
        const newIndex = newPoints.findIndex(p => p.x === newX && p.y === newY);
        
        onChange(activeChannel, newPoints);
        setDraggingIndex(newIndex);
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingIndex === null) return;
    
    const { x, y } = getSVGCoords(e);
    
    const newPoints = [...points];
    const point = newPoints[draggingIndex];

    // Convert SVG coordinates to 0-255 range
    let newX = Math.round(((x - PADDING) / GRAPH_SIZE) * 255);
    let newY = Math.round(255 - ((y - PADDING) / GRAPH_SIZE) * 255);

    // Clamp values to 0-255 range
    newX = Math.max(0, Math.min(255, newX));
    newY = Math.max(0, Math.min(255, newY));

    // Prevent crossing over adjacent points (only for intermediate points)
    if (draggingIndex > 0 && draggingIndex < points.length - 1) {
      const prevPointX = newPoints[draggingIndex - 1].x;
      const nextPointX = newPoints[draggingIndex + 1].x;
      
      point.x = Math.max(prevPointX + 1, Math.min(newX, nextPointX - 1));
      point.y = newY;
    } else {
      // Start/End points can only move vertically
      point.y = newY;
      if (draggingIndex === 0) point.x = 0;
      if (draggingIndex === points.length - 1) point.x = 255;
    }

    onChange(activeChannel, newPoints);
  }, [draggingIndex, points, onChange, activeChannel]);

  const handleMouseUp = useCallback(() => {
    if (draggingIndex !== null) {
      onCommit(activeChannel, points);
      setDraggingIndex(null);
    }
  }, [draggingIndex, onCommit, points, activeChannel]);

  useEffect(() => {
    if (draggingIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIndex, handleMouseMove, handleMouseUp]);

  const handleReset = () => {
    const newPoints: Point[] = [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ];
    onChange(activeChannel, newPoints);
    onCommit(activeChannel, newPoints);
    setIntensity(100);
  };

  const handleIntensityChange = (newIntensity: number) => {
    setIntensity(newIntensity);
    
    // Apply intensity scaling to intermediate points
    
    // Find the default diagonal points for reference
    const defaultPoints = [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ];
    
    const scaledPoints = points.map((p, i) => {
      if (i === 0 || i === points.length - 1) return p;
      
      // Calculate deviation from the default diagonal (y=x)
      const defaultY = p.x;
      const deviation = p.y - defaultY;
      
      // Scale the deviation based on intensity (100% = no change, 0% = flat line, 200% = double deviation)
      const scaleFactor = newIntensity / 100;
      const newDeviation = deviation * scaleFactor;
      
      let newY = defaultY + newDeviation;
      newY = Math.max(0, Math.min(255, Math.round(newY)));
      
      return { ...p, y: newY };
    });
    
    onChange(activeChannel, scaledPoints);
  };

  const svgPoints = points.map(p => ({
    x: PADDING + (p.x / 255) * GRAPH_SIZE,
    y: PADDING + ((255 - p.y) / 255) * GRAPH_SIZE,
  }));

  const pathData = svgPoints.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');

  const maxHistValue = Math.max(...histogramData);

  const channelColors: Record<Channel, string> = {
    all: 'hsl(var(--primary))',
    r: 'hsl(0, 100%, 50%)',
    g: 'hsl(120, 100%, 50%)',
    b: 'hsl(240, 100%, 50%)',
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as Channel)} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-4 w-48 h-8">
            <TabsTrigger value="all" className="h-6 text-xs">RGB</TabsTrigger>
            <TabsTrigger value="r" className="h-6 text-xs text-red-500">R</TabsTrigger>
            <TabsTrigger value="g" className="h-6 text-xs text-green-500">G</TabsTrigger>
            <TabsTrigger value="b" className="h-6 text-xs text-blue-500">B</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" />
            <span className="sr-only">Reset Curve</span>
          </Button>
        </div>
        <TabsContent value={activeChannel}>
          <svg 
            ref={svgRef} 
            viewBox={`0 0 ${SIZE} ${SIZE}`} 
            className="w-full h-auto bg-muted/50 rounded-md cursor-crosshair"
            onMouseDown={(e) => handleMouseDown(e.nativeEvent, null)}
          >
            {/* Histogram Background */}
            <g transform={`translate(${PADDING}, ${PADDING})`}>
              {histogramData.map((value, i) => (
                <rect
                  key={i}
                  x={(i / 255) * GRAPH_SIZE}
                  y={GRAPH_SIZE - (value / maxHistValue) * GRAPH_SIZE}
                  width={GRAPH_SIZE / 255}
                  height={(value / maxHistValue) * GRAPH_SIZE}
                  fill="hsl(var(--muted-foreground))"
                  opacity={0.3}
                />
              ))}
            </g>
            {/* Grid */}
            <path d={`M ${PADDING} ${PADDING} H ${SIZE - PADDING} V ${SIZE - PADDING} H ${PADDING} Z`} fill="none" stroke="hsl(var(--border))" />
            <path d={`M ${PADDING + GRAPH_SIZE / 4} ${PADDING} V ${SIZE - PADDING}`} stroke="hsl(var(--border))" strokeDasharray="2 2" />
            <path d={`M ${PADDING + GRAPH_SIZE / 2} ${PADDING} V ${SIZE - PADDING}`} stroke="hsl(var(--border))" strokeDasharray="2 2" />
            <path d={`M ${PADDING + (GRAPH_SIZE * 3) / 4} ${PADDING} V ${SIZE - PADDING}`} stroke="hsl(var(--border))" strokeDasharray="2 2" />
            <path d={`M ${PADDING} ${PADDING + GRAPH_SIZE / 4} H ${SIZE - PADDING}`} stroke="hsl(var(--border))" strokeDasharray="2 2" />
            <path d={`M ${PADDING} ${PADDING + GRAPH_SIZE / 2} H ${SIZE - PADDING}`} stroke="hsl(var(--border))" strokeDasharray="2 2" />
            <path d={`M ${PADDING} ${PADDING + (GRAPH_SIZE * 3) / 4} H ${SIZE - PADDING}`} stroke="hsl(var(--border))" strokeDasharray="2 2" />
            {/* Diagonal Line */}
            <path d={`M ${PADDING} ${SIZE - PADDING} L ${SIZE - PADDING} ${PADDING}`} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
            {/* Curve */}
            <path d={pathData} fill="none" stroke={channelColors[activeChannel]} strokeWidth="2" />
            {/* Points */}
            {svgPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="hsl(var(--background))"
                stroke={channelColors[activeChannel]}
                strokeWidth="2"
                className="cursor-pointer"
                onMouseDown={(e) => handleMouseDown(e.nativeEvent, i)}
              />
            ))}
          </svg>
        </TabsContent>
      </Tabs>
      
      <div className="grid gap-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="curve-intensity">Curve Intensity</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{intensity}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleIntensityChange(100)}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Intensity</span>
            </Button>
          </div>
        </div>
        <Slider
          id="curve-intensity"
          min={0}
          max={200}
          step={1}
          value={[intensity]}
          onValueChange={([value]) => handleIntensityChange(value)}
          onValueCommit={([value]) => onCommit(activeChannel, points)}
        />
      </div>
    </div>
  );
};

export default Curves;