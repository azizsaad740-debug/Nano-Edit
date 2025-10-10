import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { Point, EditState } from '@/hooks/useEditorState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

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
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDraggingIndex(index);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingIndex === null) return;
    
    const { x, y } = getSVGCoords(e);
    
    const newPoints = [...points];
    const point = newPoints[draggingIndex];

    const newX = Math.max(PADDING, Math.min(x, SIZE - PADDING));
    const newY = Math.max(PADDING, Math.min(y, SIZE - PADDING));

    // Prevent crossing over adjacent points
    const prevPointX = draggingIndex > 0 ? newPoints[draggingIndex - 1].x : -Infinity;
    const nextPointX = draggingIndex < newPoints.length - 1 ? newPoints[draggingIndex + 1].x : Infinity;

    point.x = Math.max(prevPointX + 1, Math.min(newX, nextPointX - 1));
    point.y = newY;

    // Don't allow moving the start/end points horizontally
    if (draggingIndex === 0) point.x = PADDING;
    if (draggingIndex === points.length - 1) point.x = SIZE - PADDING;

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
    const newPoints = [
      { x: PADDING, y: SIZE - PADDING },
      { x: SIZE - PADDING, y: PADDING },
    ];
    onChange(activeChannel, newPoints);
    onCommit(activeChannel, newPoints);
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
    <div className="space-y-2">
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
          <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto bg-muted/50 rounded-md cursor-crosshair">
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
                onMouseDown={(e) => handleMouseDown(e, i)}
              />
            ))}
          </svg>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Curves;