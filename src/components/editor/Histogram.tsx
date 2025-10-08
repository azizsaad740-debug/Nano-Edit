import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HistogramProps {
  imageElement: HTMLImageElement | null;
}

interface HistogramData {
  level: number;
  luminance: number;
}

const Histogram = ({ imageElement }: HistogramProps) => {
  const [data, setData] = useState<HistogramData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageElement || !imageElement.complete || imageElement.naturalWidth === 0) {
      setData(null);
      setLoading(true);
      return;
    }

    setLoading(true);
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

    const histogramData = luminanceBins.map((count, index) => ({
      level: index,
      luminance: count,
    }));

    setData(histogramData);
    setLoading(false);
  }, [imageElement, imageElement?.src]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Luminance Histogram</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : data ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="level" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} interval={63} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: '12px',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="luminance" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Could not generate histogram.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Histogram;