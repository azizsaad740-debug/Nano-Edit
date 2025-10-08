import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SampleImagesProps {
  onSelect: (url: string) => void;
}

const sampleImageUrls = [
  "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&q=80",
  "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80",
  "https://images.unsplash.com/photo-1542228263-4d5345cf082f?w=800&q=80",
  "https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=800&q=80",
];

const SampleImages = ({ onSelect }: SampleImagesProps) => {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-muted-foreground mb-4">Or try one of these sample images</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sampleImageUrls.map((url, index) => (
          <div 
            key={index} 
            className="rounded-lg overflow-hidden cursor-pointer group relative"
            onClick={() => onSelect(url)}
          >
            <img 
              src={url} 
              alt={`Sample ${index + 1}`} 
              className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SampleImages;