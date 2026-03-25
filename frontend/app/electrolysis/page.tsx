import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ElectrolysisPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Electrolysis Calculator</h1>
        <p className="text-muted-foreground">
          Calculate electrolysis current, time, and product yields using Faraday&apos;s laws.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            This section will include an interactive electrolysis calculator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Navigate back to the home page or try another tool from the navbar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
