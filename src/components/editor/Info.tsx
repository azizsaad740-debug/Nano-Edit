import { formatBytes } from "@/lib/utils";

interface InfoProps {
  dimensions: {
    width: number;
    height: number;
  } | null;
  fileInfo: {
    name: string;
    size: number;
  } | null;
}

const Info = ({ dimensions, fileInfo }: InfoProps) => {
  if (!dimensions || !fileInfo) {
    return <p className="text-sm text-muted-foreground">No image loaded.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Filename:</span>
        <span className="truncate max-w-[150px]" title={fileInfo.name}>{fileInfo.name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Size:</span>
        <span>{formatBytes(fileInfo.size)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Width:</span>
        <span>{dimensions.width} px</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Height:</span>
        <span>{dimensions.height} px</span>
      </div>
    </div>
  );
};

export default Info;