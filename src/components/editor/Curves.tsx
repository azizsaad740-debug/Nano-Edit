import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CurvesState, Point } from '@/types/editor';
import { isDefault } from '@/utils/filterUtils';

interface CurvesProps {
  curves: CurvesState;
  onCurvesChange: (channel: keyof CurvesState, points: Point[]) => void;
  onCurvesCommit: (channel: keyof CurvesState, points: Point[]) => void;
  imgRef: React.RefObject<HTMLImageElement>;
}

const Curves = ({ curves, onCurvesChange, onCurvesCommit, imgRef }: CurvesProps) => {
  const [selectedChannel, setSelectedChannel] = useState<keyof CurvesState>('all');
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);

  const currentPoints = curves[selectedChannel];

  const handleReset = useCallback(() => {
    const defaultPoints: Point[] = [{ x: 0, y: 0 }, { x: 255, y: 255 }];
    onCurvesChange(selectedChannel, defaultPoints);
    onCurvesCommit(selectedChannel, defaultPoints);
  }, [selectedChannel, onCurvesChange, onCurvesCommit]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width;
    const chartHeight = rect.height;

    const pointX = Math.round((x / chartWidth) * 255);
    const pointY = Math.round(255 - (y / chartHeight) * 255);

    // Check if clicking near an existing point
    const tolerance = 15;
    const existingIndex = currentPoints.findIndex(p => {
      const px = (p.x / 255) * chartWidth;
      const py = chartHeight - (p.y / 255) * chartHeight;
      return Math.abs(px - x) < tolerance && Math.abs(py - y) < tolerance;
    });

    if (existingIndex !== -1) {
      // Start dragging existing point
      setDragPointIndex(existingIndex);
    } else {
      // Add new point if not dragging and not clicking near start/end points (0, 255)
      if (pointX > 5 && pointX < 250) {
        const newPoint: Point = { x: pointX, y: pointY };
        const newPoints = [...currentPoints, newPoint].sort((a, b) => a.x - b.x);
        onCurvesChange(selectedChannel, newPoints);
        setDragPointIndex(newPoints.findIndex(p => p.x === pointX && p.y === pointY));
      }
    }
  }, [currentPoints, selectedChannel, onCurvesChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragPointIndex === null || !chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width;
    const chartHeight = rect.height;

    let pointX = Math.round((x / chartWidth) * 255);
    let pointY = Math.round(255 - (y / chartHeight) * 255);

    // Clamp values
    pointX = Math.min(255, Math.max(0, pointX));
    pointY = Math.min(255, Math.max(0, pointY));

    const newPoints = currentPoints.map((p, index) => {
      if (index === dragPointIndex) {
        // Prevent moving start/end points (index 0 and last index)
        if (index === 0) return { x: 0, y: pointY };
        if (index === currentPoints.length - 1) return { x: 255, y: pointY };
        
        return { x: pointX, y: pointY };
      }
      return p;
    }).sort((a, b) => a.x - b.x);

    onCurvesChange(selectedChannel, newPoints);
  }, [dragPointIndex, currentPoints, selectedChannel, onCurvesChange]);

  const handleMouseUp = useCallback(() => {
    if (dragPointIndex !== null) {
      onCurvesCommit(selectedChannel, curves[selectedChannel]);
    }
    setDragPointIndex(null);
  }, [dragPointIndex, selectedChannel, curves, onCurvesCommit]);

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Data preparation for Recharts
  const chartData = useMemo(() => {
    // Interpolate points to create a smooth curve path for visualization
    const interpolated = [];
    const points = curves[selectedChannel].slice().sort((a, b) => a.x - b.x);
    
    // Simple linear interpolation for visualization (a real curve would use splines)
    for (let i = 0; i < 256; i++) {
      let y = 0;
      for (let j = 0; j < points.length - 1; j++) {
        const p1 = points[j];
        const p2 = points[j + 1];
        if (i >= p1.x && i <= p2.x) {
          const ratio = (i - p1.x) / (p2.x - p1.x);
          y = p1.y + (p2.y - p1.y) * ratio;
          break;
        }
      }
      interpolated.push({ level: i, value: y });
    }
    return interpolated;
  }, [curves, selectedChannel]);

  const colorMap: Record<keyof CurvesState, string> = {
    all: 'hsl(var(--primary))',
    r: 'hsl(0, 100%, 50%)',
    g: 'hsl(120, 100%, 50%)',
    b: 'hsl(240, 100%, 50%)',
  };
  
  const channelNameMap: Record<keyof CurvesState, string> = {
    all: 'RGB',
    r: 'Red',
    g: 'Green',
    b: 'Blue',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Curves</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Select
            value={selectedChannel}
            onValueChange={(v) => setSelectedChannel(v as keyof CurvesState)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Channel" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(channelNameMap).map(key => (
                <SelectItem key={key} value={key}>
                  {channelNameMap[key as keyof CurvesState]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isDefault(currentPoints)}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>

        <div ref={chartRef} className="h-48 relative" onMouseDown={handleMouseDown}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="level" type="number" domain={[0, 255]} hide />
              <YAxis type="number" domain={[0, 255]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  fontSize: '12px',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value, name, props) => [`Output: ${Math.round(value)}`, `Input: ${props.payload.level}`]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colorMap[selectedChannel]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {/* Render control points */}
              {currentPoints.map((p, index) => (
                <circle
                  key={index}
                  cx={(p.x / 255) * 100 + '%'}
                  cy={100 - (p.y / 255) * 100 + '%'}
                  r={5}
                  fill="white"
                  stroke={colorMap[selectedChannel]}
                  strokeWidth={2}
                  className={cn(
                    "cursor-pointer",
                    (index === 0 || index === currentPoints.length - 1) && "cursor-default"
                  )}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragPointIndex(index);
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 pointer-events-none">
            {/* Overlay for visual guides */}
            <div className="absolute top-0 left-0 w-full h-full border border-dashed border-muted-foreground/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Curves;