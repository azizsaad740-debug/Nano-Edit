interface InfoProps {
  dimensions: {
    width: number;
    height: number;
  } | null;
}

const Info = ({ dimensions }: InfoProps) => {
  if (!dimensions) {
    return <p className="text-sm text-muted-foreground">No image loaded.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
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