"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_SMILES_LENGTH = 300; 

interface MoleculeProperties {
  formula?: string;
  molecular_weight?: number;
  logp?: number;
  tpsa?: number;
  rotatable_bonds?: number;
  hbd?: number;
  hba?: number;
}

interface ConversionResult {
  valid: boolean;
  image_base64?: string;
  properties?: MoleculeProperties;
  inchi?: string;
  inchikey?: string;
  molblock?: string;
  error?: string;
}

interface SearchResult {
  name: string;
  smiles: string;
  cid: number;
}

export default function ConverterPage() {
  const [input, setInput] = useState("CCO"); // default ethanol
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiFetch<ConversionResult>("/chemistry/convert", {
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

  const handleSearch = async () => {
    setSearching(true);
    setSearchResults([]);
    try {
      const data = await apiFetch<SearchResult[]>("/chemistry/search", {
        method: "POST",
        body: JSON.stringify({ query: input, max_results: 10 }),
      });
      setSearchResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const selectMolecule = (smiles: string) => {
    setInput(smiles);
    setSearchResults([]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">SMILES Structure Converter</h1>
        <p className="text-muted-foreground">
          Paste a SMILES string to see the 2D structure, molecular properties, InChI and more.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>
            Enter a SMILES string, InChI, common name (e.g., aspirin), or molecular formula (e.g., C2H6O).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smiles">Compound input</Label>
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
              placeholder="e.g. CCO, aspirin, C2H6O, InChI=1S/CH4/h1H4"
              className="font-mono"
              maxLength={MAX_SMILES_LENGTH + 10}
            />
            <div className="text-xs text-right text-muted-foreground">
              {input.length} / {MAX_SMILES_LENGTH} characters
              {input.length > MAX_SMILES_LENGTH * 0.9 && " (approaching limit)"}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConvert} disabled={loading || !input.trim()} className="flex-1">
              {loading ? "Converting..." : "Convert Molecule"}
            </Button>
            <Button onClick={handleSearch} disabled={searching || !input.trim()} className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              {searching ? "Searching..." : "Search PubChem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Click on a molecule to select it for conversion.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((res, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">{res.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">{res.smiles}</div>
                  </div>
                  <Button onClick={() => selectMolecule(res.smiles)} className="h-8 px-3 text-xs">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/30">
          {error}
        </div>
      )}

      {result && (
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Molecule Structure</CardTitle>
            </CardHeader>
            <CardContent>
              {result.valid && result.image_base64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${result.image_base64}`}
                  alt="Molecule structure"
                  className="max-w-full h-auto mx-auto bg-white p-4 rounded border"
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No valid structure generated
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Properties & Identifiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.valid && result.properties ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium">Formula</dt>
                    <dd>{result.properties.formula ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Molecular Weight</dt>
                    <dd>{result.properties.molecular_weight?.toFixed(2) ?? "—"} g/mol</dd>
                  </div>
                  <div>
                    <dt className="font-medium">LogP</dt>
                    <dd>{result.properties.logp?.toFixed(2) ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">TPSA</dt>
                    <dd>{result.properties.tpsa?.toFixed(2) ?? "—"} Å²</dd>
                  </div>
                  <div>
                    <dt className="font-medium">H-bond Donors</dt>
                    <dd>{result.properties.hbd ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">H-bond Acceptors</dt>
                    <dd>{result.properties.hba ?? "—"}</dd>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No properties available</div>
              )}

              {result.inchi && (
                <div>
                  <Label className="text-sm font-medium">InChI</Label>
                  <Textarea readOnly value={result.inchi} className="font-mono text-xs h-20 mt-1" />
                </div>
              )}

              {result.inchikey && (
                <div>
                  <Label className="text-sm font-medium">InChIKey</Label>
                  <div className="font-mono text-sm bg-muted p-2 rounded mt-1">
                    {result.inchikey}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {loading && !result && (
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

  );
}