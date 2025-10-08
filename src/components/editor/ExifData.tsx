import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ExifDataProps {
  data: any;
}

const EXIF_KEYS_TO_DISPLAY = {
  'Model': 'Camera Model',
  'Make': 'Camera Make',
  'DateTimeOriginal': 'Date Taken',
  'ExposureTime': 'Exposure Time',
  'FNumber': 'Aperture',
  'ISOSpeedRatings': 'ISO',
  'FocalLength': 'Focal Length',
  'LensModel': 'Lens Model',
};

const ExifData = ({ data }: ExifDataProps) => {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const entries = Object.entries(EXIF_KEYS_TO_DISPLAY)
    .map(([key, label]) => {
      const tag = data[key];
      if (tag && tag.description) {
        return { label, value: tag.description };
      }
      return null;
    })
    .filter(Boolean);

  if (entries.length === 0) {
    return (
        <p className="text-sm text-muted-foreground mt-4">No common EXIF data found.</p>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full mt-4" defaultValue="exif-data">
      <AccordionItem value="exif-data">
        <AccordionTrigger>EXIF Data</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            {entries.map((entry) => (
              entry && (
                <div key={entry.label} className="flex justify-between">
                  <span className="text-muted-foreground">{entry.label}:</span>
                  <span className="truncate max-w-[150px]" title={entry.value}>{entry.value}</span>
                </div>
              )
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ExifData;