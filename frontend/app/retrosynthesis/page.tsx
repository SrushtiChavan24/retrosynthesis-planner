"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_SMILES_LENGTH = 300;

interface RetrosynthesisResult {
  target: string;
  reaction_type?: string;
  reactants?: string;
  description?: string;
  found: boolean;
}

export default function RetrosynthesisPage() {
  const [input, setInput] = useState("CCOC(=O)C"); // default ethyl acetate
  const [result, setResult] = useState<RetrosynthesisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiFetch<RetrosynthesisResult>("/retrosynthesis/analyze", {
        method: "POST",
        body: JSON.stringify({ smiles: input }),
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">Retrosynthesis Planner</h1>
        <p className="text-muted-foreground">
          Generate possible reaction pathways from target molecules backward to starting materials.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target Molecule</CardTitle>
          <CardDescription>
            Enter the SMILES string of the target molecule you want to synthesize.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smiles">Target SMILES</Label>
            <Input
              id="input"
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length > MAX_SMILES_LENGTH) {
                  setError(`Input too long (max ${MAX_SMILES_LENGTH} characters)`);
                  return;
                }
                setInput(val);
                setError(null);
              }}
              placeholder="e.g. CCOC(=O)C (ethyl acetate)"
              className="font-mono"
              maxLength={MAX_SMILES_LENGTH + 10}
            />
            <div className="text-xs text-right text-muted-foreground">
              {input.length} / {MAX_SMILES_LENGTH} characters
              {input.length > MAX_SMILES_LENGTH * 0.9 && " (approaching limit)"}
            </div>
          </div>

          <Button onClick={handleAnalyze} disabled={loading || !input.trim()} className="w-full">
            {loading ? "Analyzing..." : "Analyze Retrosynthesis"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/30">
          {error}
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Retrosynthesis Results</CardTitle>
            <CardDescription>
              Analysis for target molecule: <code className="font-mono">{result.target}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.found ? (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800 dark:text-green-200">Pathway Found</span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    A retrosynthesis pathway was identified for this target molecule.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium">Reaction Type</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <span className="font-medium">{result.reaction_type}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Starting Materials</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
                      {result.reactants}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Reaction Description</Label>
                  <div className="mt-1 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200">{result.description}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Reaction Pathway</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg font-mono text-sm">
                    <div className="text-center mb-2">Target Molecule</div>
                    <div className="text-center text-lg mb-2">↓</div>
                    <div className="text-center text-lg mb-2">{result.reaction_type}</div>
                    <div className="text-center text-lg mb-2">↓</div>
                    <div className="text-center">Starting Materials</div>
                    <div className="mt-4 p-2 bg-white dark:bg-gray-800 rounded border text-center">
                      {result.reactants}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">No Retrosynthesis Pathway Found</h3>
                <p className="text-muted-foreground mb-4">
                  Could not find a retrosynthesis pathway for <code className="font-mono">{result.target}</code> in our current database.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>Try these example molecules that have known pathways:</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {["CCOC(=O)C", "CCO", "CC=O"].map((example) => (
                      <Button
                        key={example}
                        
                        onClick={() => setInput(example)}
                        className="font-mono text-xs"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && !result && (
        <Card>
          <CardHeader>
            <CardTitle>Analyzing Retrosynthesis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
