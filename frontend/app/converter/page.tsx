"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const MAX_INPUT_LENGTH = 300;

interface ElementBohrModel {
  count: number;
  name: string;
  atomic_number: string;
  bohr_model_image_2d: string;
  bohr_model_3d: string;
  electron_configuration: string;
  electronegativity: string;
}

interface ReactivityAnalysis {
  reactivity_level: string;
  reactivity_score: number;
  functional_groups: string[];
  polarity_tpsa: number;
  flexibility: string;
  rotatable_bonds: number;
  drug_likeness: string;
  lipinski_violations: string[];
  lipinski_pass: boolean;
}

interface MoleculeProperties {
  formula?: string;
  molecular_weight?: number;
  logp?: number;
  tpsa?: number;
  rotatable_bonds?: number;
  hbd?: number;
  hba?: number;
  exact_mass?: number;
  heavy_atom_count?: number;
  ring_count?: number;
}

interface EnhancedAnalysisResult {
  valid: boolean;
  canonical_smiles?: string;
  inchi?: string;
  inchikey?: string;
  molblock?: string;
  image_base64?: string;
  properties?: MoleculeProperties;
  reactivity?: ReactivityAnalysis;
  element_bohr_models?: Record<string, ElementBohrModel>;
  molecular_formula?: string;
  error?: string;
}

interface SearchResult {
  name: string;
  smiles: string;
  cid: number;
}

interface DatasetMolecule {
  smiles: string;
  pic50: number;
  num_atoms: number;
  logp: number;
  index: number;
}

export default function SmilesConverterPage() {
  const [input, setInput] = useState("CCO");
  const [result, setResult] = useState<EnhancedAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"structure" | "properties" | "bohr" | "reactivity">("structure");
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetResults, setDatasetResults] = useState<DatasetMolecule[]>([]);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetStats, setDatasetStats] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedTab("structure");

    try {
      const data = await apiFetch<EnhancedAnalysisResult>("/chemistry/analyze-enhanced", {
        method: "POST",
        body: JSON.stringify({ smiles: input.trim() }),
      });
      
      if (!data.valid) {
        setError(data.error || "Invalid or unsupported input");
      } else {
        setResult(data);
      }
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

  const loadDatasetSample = async () => {
    setDatasetLoading(true);
    try {
      const data = await apiFetch<DatasetMolecule[]>("/chemistry/dataset-sample", {
        method: "GET",
      });
      setDatasetResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dataset");
    } finally {
      setDatasetLoading(false);
    }
  };

  const loadDatasetStats = async () => {
    try {
      const data = await apiFetch<any>("/chemistry/dataset-stats", {
        method: "GET",
      });
      setDatasetStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics");
    }
  };

  const searchDataset = async () => {
    if (!datasetSearch.trim()) return;
    
    setDatasetLoading(true);
    try {
      const data = await apiFetch<DatasetMolecule[]>("/chemistry/dataset-search", {
        method: "POST",
        body: JSON.stringify({ query: datasetSearch.trim(), limit: 50 }),
      });
      setDatasetResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setDatasetLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  // Load dataset on component mount
  React.useEffect(() => {
    loadDatasetSample();
    loadDatasetStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SMILES Converter Studio
          </h1>
          <p className="text-lg text-muted-foreground">
            Advanced molecular analysis: structure, properties, reactivity & Bohr models
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Molecular Input</CardTitle>
            <CardDescription>
              Enter SMILES, InChI, chemical name, or formula. Examples: CCO (ethanol), aspirin, C2H6O, H2O
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">Compound Input</Label>
              <Input
                id="input"
                value={input}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= MAX_INPUT_LENGTH) {
                    setInput(val);
                    setError(null);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g., CCO, aspirin, C2H6O, InChI=1S/CH4/h1H4"
                className="font-mono text-base"
                maxLength={MAX_INPUT_LENGTH}
              />
              <div className="text-xs text-right text-muted-foreground">
                {input.length} / {MAX_INPUT_LENGTH} characters
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={loading || !input.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {loading ? "Analyzing..." : "📊 Analyze Molecule"}
              </Button>
              <Button
                onClick={handleSearch}
                disabled={searching || !input.trim()}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {searching ? "Searching..." : "🔍 Search PubChem"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>Click to select a molecule for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchResults.map((res, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{res.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{res.smiles}</div>
                    </div>
                    <Button onClick={() => selectMolecule(res.smiles)} size="sm" className="ml-2 flex-shrink-0">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Dataset Browser Section */}
        <div className="space-y-6">
          {/* Dataset Statistics */}
          {datasetStats && (
            <Card className="shadow-lg border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle>📊 SMILES Dataset Browser</CardTitle>
                <CardDescription>Bioactive molecule dataset for discovery and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Molecules", value: datasetStats.total_molecules || 0, icon: "🧬" },
                    { label: "pIC50 Range", value: `${datasetStats.pic50_min?.toFixed(2) || "—"} - ${datasetStats.pic50_max?.toFixed(2) || "—"}`, icon: "📊" },
                    { label: "Atoms (Avg)", value: datasetStats.num_atoms_mean ? datasetStats.num_atoms_mean.toFixed(1) : "—", icon: "⚛️" },
                    { label: "LogP (Avg)", value: datasetStats.logp_mean ? datasetStats.logp_mean.toFixed(2) : "—", icon: "💧" },
                  ].map((stat, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">{stat.icon} {stat.label}</div>
                      <div className="text-lg font-bold text-green-600">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={datasetSearch}
                      onChange={(e) => setDatasetSearch(e.target.value)}
                      placeholder="Search by pIC50 (e.g., 4.8) or SMILES substring..."
                      className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") searchDataset();
                      }}
                    />
                    <Button
                      onClick={searchDataset}
                      disabled={datasetLoading || !datasetSearch.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {datasetLoading ? "Searching..." : "🔍 Search"}
                    </Button>
                    <Button
                      onClick={loadDatasetSample}
                      disabled={datasetLoading}
                      variant="outline"
                    >
                      🎲 Sample
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dataset Results */}
          {datasetResults.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>🧬 Dataset Molecules ({datasetResults.length})</CardTitle>
                <CardDescription>Click "Analyze" to examine a molecule in detail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {datasetResults.map((mol, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:shadow-md hover:bg-slate-50 transition">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-start mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">📈 pIC50</div>
                          <div className="font-bold text-lg text-blue-600">{mol.pic50.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">⚛️ Atoms</div>
                          <div className="font-bold text-lg text-purple-600">{mol.num_atoms}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">💧 LogP</div>
                          <div className="font-bold text-lg text-orange-600">{mol.logp.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">🔢 Index</div>
                          <div className="font-bold text-lg text-slate-600">#{mol.index}</div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => {
                              setInput(mol.smiles);
                              handleAnalyze();
                            }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                          >
                            Analyze
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          readOnly
                          value={mol.smiles}
                          className="flex-1 px-2 py-1 border rounded font-mono text-xs bg-slate-50"
                        />
                        <Button
                          onClick={() => copyToClipboard(mol.smiles)}
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0"
                        >
                          📋
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {datasetLoading && !result && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">⏳ Loading dataset...</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        {result && result.valid && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "structure" as const, label: "🏗️ Structure" },
                { value: "properties" as const, label: "📋 Properties" },
                { value: "bohr" as const, label: "⚛️ Bohr Models" },
                { value: "reactivity" as const, label: "⚡ Reactivity" },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={selectedTab === tab.value ? "default" : "outline"}
                  onClick={() => setSelectedTab(tab.value)}
                  className="text-sm"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Structure Tab */}
            {selectedTab === "structure" && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Molecular Structure</CardTitle>
                  <CardDescription>2D representation of the molecule</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.image_base64 ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-4 rounded-lg border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${result.image_base64}`}
                          alt="Molecule structure"
                          className="max-w-2xl max-h-96 mx-auto"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = `data:image/png;base64,${result.image_base64}`;
                          link.download = `molecule_${result.molecular_formula || "structure"}.png`;
                          link.click();
                        }}
                        className="w-full"
                      >
                        ⬇️ Download Structure (PNG)
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No structure image could be generated
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Properties Tab */}
            {selectedTab === "properties" && (
              <div className="space-y-6">
                {/* Molecular Analysis Card */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Molecular Analysis</CardTitle>
                    <CardDescription>Physical and chemical properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.properties ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                          {[
                            {
                              label: "🧪 Mol. Weight",
                              value: result.properties.molecular_weight?.toFixed(2),
                              unit: "g/mol",
                            },
                            {
                              label: "📊 LogP",
                              value: result.properties.logp?.toFixed(2),
                              unit: "",
                            },
                            {
                              label: "💧 H-Donors",
                              value: result.properties.hbd,
                              unit: "",
                            },
                            {
                              label: "💧 H-Acceptors",
                              value: result.properties.hba,
                              unit: "",
                            },
                            {
                              label: "🌐 TPSA",
                              value: result.properties.tpsa?.toFixed(2),
                              unit: "Ų",
                            },
                            {
                              label: "🔄 Rotatable Bonds",
                              value: result.properties.rotatable_bonds,
                              unit: "",
                            },
                            {
                              label: "⚛️ Heavy Atoms",
                              value: result.properties.heavy_atom_count,
                              unit: "",
                            },
                            {
                              label: "🔗 Rings",
                              value: result.properties.ring_count,
                              unit: "",
                            },
                            {
                              label: "📐 Exact Mass",
                              value: result.properties.exact_mass?.toFixed(4),
                              unit: "u",
                            },
                          ].map((item, idx) => (
                            <div key={idx} className="p-4 border rounded-lg bg-slate-50">
                              <div className="text-sm font-medium text-muted-foreground">{item.label}</div>
                              <div className="text-2xl font-bold mt-1">
                                {item.value ?? "—"} <span className="text-sm text-muted-foreground">{item.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Chemical Formula */}
                        <div className="p-4 border-t pt-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2">Chemical Formula</div>
                          <div className="bg-slate-100 p-3 rounded font-mono text-center font-bold text-lg">
                            {result.properties.formula || "—"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">No properties available</div>
                    )}
                  </CardContent>
                </Card>

                {/* Identifiers Card */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Molecular Identifiers</CardTitle>
                    <CardDescription>Standardized molecular representations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Canonical SMILES", value: result.canonical_smiles, icon: "🔤" },
                      { label: "InChI", value: result.inchi, icon: "📝" },
                      { label: "InChI Key", value: result.inchikey, icon: "🔑" },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-sm font-medium">{item.icon} {item.label}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.value || "—"}
                            readOnly
                            className="flex-1 px-3 py-2 border rounded font-mono text-sm bg-slate-50"
                          />
                          {item.value && (
                            <Button
                              onClick={() => copyToClipboard(item.value!)}
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0"
                            >
                              📋
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Molblock (V2000) */}
                    {result.molblock && (
                      <div className="space-y-2 pt-4 border-t">
                        <label className="text-sm font-medium">📄 Molfile V2000</label>
                        <Textarea
                          readOnly
                          value={result.molblock}
                          className="font-mono text-xs h-32 bg-slate-50"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lipinski's Rule of Five */}
                <Card className="shadow-lg border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle>🏥 Lipinski's Rule of Five</CardTitle>
                    <CardDescription>Drug-likeness prediction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status:</span>
                        <Badge className={result.reactivity?.lipinski_pass ? "bg-green-600" : "bg-red-600"}>
                          {result.reactivity?.drug_likeness || "Check"}
                        </Badge>
                      </div>
                      {result.reactivity?.lipinski_violations && result.reactivity.lipinski_violations.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Violations:</div>
                          {result.reactivity.lipinski_violations.map((violation, idx) => (
                            <div key={idx} className="text-sm text-red-700 flex items-center gap-2">
                              ⚠️ {violation}
                            </div>
                          ))}
                        </div>
                      )}
                      {result.reactivity?.lipinski_pass && (
                        <div className="text-sm text-green-700">✅ Passes all Lipinski criteria</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bohr Models Tab */}
            {selectedTab === "bohr" && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>⚛️ Element Bohr Models</CardTitle>
                  <CardDescription>Electron orbital diagrams for constituent elements</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.element_bohr_models && Object.keys(result.element_bohr_models).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(result.element_bohr_models).map(([symbol, data]) => (
                        <div key={symbol} className="border rounded-lg p-4 space-y-3 hover:shadow-lg transition">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="text-lg font-bold">{symbol}</div>
                              <div className="text-sm text-muted-foreground">{data.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">Count: {data.count}</div>
                              <div className="text-xs text-muted-foreground">Z = {data.atomic_number}</div>
                            </div>
                          </div>

                          {/* Electron Configuration */}
                          <div className="pt-2 border-t">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Config</div>
                            <div className="text-xs font-mono bg-slate-50 p-2 rounded">
                              {data.electron_configuration}
                            </div>
                          </div>

                          {/* Electronegativity */}
                          {data.electronegativity && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Electronegativity</div>
                              <Badge variant="outline">{data.electronegativity}</Badge>
                            </div>
                          )}

                          {/* Bohr Model Images */}
                          <div className="space-y-3 pt-2">
                            {data.bohr_model_image_2d && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium">Bohr Model 2D</div>
                                <a
                                  href={data.bohr_model_image_2d}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={data.bohr_model_image_2d}
                                    alt={`${symbol} Bohr model 2D`}
                                    className="w-32 h-32 object-contain border rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                </a>
                              </div>
                            )}

                            {data.bohr_model_3d && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium">3D Model (GLB)</div>
                                <a
                                  href={data.bohr_model_3d}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                                >
                                  🎬 View 3D Model →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No Bohr model data available for this molecule
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reactivity Tab */}
            {selectedTab === "reactivity" && result.reactivity && (
              <div className="space-y-6">
                {/* Reactivity Overview */}
                <Card className="shadow-lg border-2 border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle>⚡ Molecular Reactivity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 border rounded-lg bg-white">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Reactivity Level</div>
                        <div className="text-2xl font-bold text-orange-600">{result.reactivity.reactivity_level}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Score: {result.reactivity.reactivity_score}
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-white">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Molecular Flexibility</div>
                        <div className="text-2xl font-bold text-blue-600">{result.reactivity.flexibility}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {result.reactivity.rotatable_bonds} rotatable bond(s)
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-white">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Polarity (TPSA)</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {result.reactivity.polarity_tpsa.toFixed(2)} Ų
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Topological Polar Surface Area</div>
                      </div>

                      <div className="p-4 border rounded-lg bg-white">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Drug-Likeness</div>
                        <Badge className={result.reactivity.lipinski_pass ? "bg-green-600 text-lg" : "bg-red-600 text-lg"}>
                          {result.reactivity.drug_likeness}
                        </Badge>
                      </div>
                    </div>

                    {/* Functional Groups */}
                    {result.reactivity.functional_groups && result.reactivity.functional_groups.length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="font-medium mb-3">Detected Functional Groups:</div>
                        <div className="flex flex-wrap gap-2">
                          {result.reactivity.functional_groups.map((group, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm">
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lipinski Violations */}
                    {result.reactivity.lipinski_violations && result.reactivity.lipinski_violations.length > 0 && (
                      <div className="pt-4 border-t bg-red-50 p-4 rounded">
                        <div className="font-medium text-red-900 mb-2">⚠️ Lipinski Violations:</div>
                        {result.reactivity.lipinski_violations.map((violation, idx) => (
                          <div key={idx} className="text-sm text-red-700">
                            • {violation}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}