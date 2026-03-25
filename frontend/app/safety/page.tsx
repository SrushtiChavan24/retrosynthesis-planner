import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SafetyCheckerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Safety Checker</h1>
        <p className="text-muted-foreground">
          Analyze reactions and molecules for known hazards and safety guidelines.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            This section will include safety scoring, hazard icons, and handling tips.
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
