import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-8">
      <Card className="w-full max-w-4xl mt-12">
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>
            Welcome to NanoEdit. These terms and conditions outline the rules and regulations for the use of NanoEdit's Website and Services.
          </p>
          <h3 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h3>
          <p>
            By accessing and using our service, you accept and agree to be bound by the terms and provisions of this agreement.
          </p>
          <h3 className="text-xl font-semibold text-foreground">2. Use License</h3>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on NanoEdit's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>
          <h3 className="text-xl font-semibold text-foreground">3. Disclaimer</h3>
          <p>
            The materials on NanoEdit's website are provided on an 'as is' basis. NanoEdit makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <Link to="/login" className="text-primary hover:underline">
            &larr; Return to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;