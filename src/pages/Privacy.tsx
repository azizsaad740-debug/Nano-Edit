import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-8">
      <Card className="w-full max-w-4xl mt-12">
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>
            Your privacy is important to us. It is NanoEdit's policy to respect your privacy regarding any information we may collect from you across our website.
          </p>
          <h3 className="text-xl font-semibold text-foreground">1. Information We Collect</h3>
          <p>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
          </p>
          <h3 className="text-xl font-semibold text-foreground">2. Log Data</h3>
          <p>
            We may process information included in log files. The log data may include your IP address, browser type and version, the pages you visit, the time and date of your visit, the time spent on those pages, and other statistics.
          </p>
          <h3 className="text-xl font-semibold text-foreground">3. Security of Your Personal Information</h3>
          <p>
            We use reasonable technical and organizational measures to secure your personal information and to avoid loss, misuse, or alteration of your personal information.
          </p>
          <Link to="/login" className="text-primary hover:underline">
            &larr; Return to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy;