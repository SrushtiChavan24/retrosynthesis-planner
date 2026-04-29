"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calculator, Zap, Clock, Atom, Beaker } from "lucide-react";

interface Substance {
  name: string;
  formula: string;
  molarMass: number;
  valency: number;
  description: string;
}

const substances: Substance[] = [
  { name: "Copper", formula: "Cu", molarMass: 63.55, valency: 2, description: "Copper metal from copper sulfate solution" },
  { name: "Aluminum", formula: "Al", molarMass: 26.98, valency: 3, description: "Aluminum metal from aluminum oxide" },
  { name: "Sodium", formula: "Na", molarMass: 22.99, valency: 1, description: "Sodium metal from molten sodium chloride" },
  { name: "Chlorine", formula: "Cl₂", molarMass: 70.90, valency: 1, description: "Chlorine gas from brine solution" },
  { name: "Oxygen", formula: "O₂", molarMass: 32.00, valency: 4, description: "Oxygen gas from water electrolysis" },
  { name: "Hydrogen", formula: "H₂", molarMass: 2.02, valency: 2, description: "Hydrogen gas from water electrolysis" },
];

const FARADAY_CONSTANT = 96485; // C/mol

function LoadingAnimation() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        {/* Upside down triangular test tube */}
        <svg width="120" height="160" viewBox="0 0 120 160" className="animate-pulse">
          {/* Test tube body */}
          <path
            d="M20 20 L100 20 L95 120 L25 120 Z"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            className="animate-pulse"
          />
          {/* Test tube bottom */}
          <path
            d="M25 120 L95 120 L90 140 L30 140 Z"
            fill="#3b82f6"
            opacity="0.3"
            className="animate-pulse"
          />
          {/* Bubbles animation */}
          <circle cx="60" cy="80" r="3" fill="#60a5fa" opacity="0.7">
            <animate attributeName="cy" values="80;40;80" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="90" r="2" fill="#60a5fa" opacity="0.5">
            <animate attributeName="cy" values="90;50;90" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy="70" r="2.5" fill="#60a5fa" opacity="0.6">
            <animate attributeName="cy" values="70;30;70" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </svg>
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">Calculating...</p>
        </div>
      </div>
    </div>
  );
}

export default function ElectrolysisPage() {
  const [selectedSubstance, setSelectedSubstance] = useState<Substance | null>(null);
  const [current, setCurrent] = useState<string>("");
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [seconds, setSeconds] = useState<string>("");
  const [efficiency, setEfficiency] = useState<number[]>([100]);
  const [isCalculating, setIsCalculating] = useState(false);

  const [results, setResults] = useState<{
    theoreticalYield: number;
    molesProduced: number;
    totalCharge: number;
    electronsTransferred: number;
  } | null>(null);

  const calculateYield = async () => {
    if (!selectedSubstance || !current || (!hours && !minutes && !seconds)) return;

    setIsCalculating(true);

    // Simulate calculation delay for animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const I = parseFloat(current); // Amperes
    const h = parseFloat(hours) || 0;
    const m = parseFloat(minutes) || 0;
    const s = parseFloat(seconds) || 0;
    const t = (h * 3600) + (m * 60) + s; // Convert to total seconds
    const M = selectedSubstance.molarMass; // g/mol
    const n = selectedSubstance.valency; // electrons per ion
    const efficiency_factor = efficiency[0] / 100;

    // Total charge passed (Coulombs)
    const totalCharge = I * t * efficiency_factor;

    // Moles of electrons transferred
    const molesElectrons = totalCharge / FARADAY_CONSTANT;

    // Moles of substance produced
    const molesProduced = molesElectrons / n;

    // Theoretical yield (mass in grams)
    const theoreticalYield = molesProduced * M;

    setResults({
      theoreticalYield,
      molesProduced,
      totalCharge,
      electronsTransferred: molesElectrons * 6.022e23, // Convert to number of electrons
    });

    setIsCalculating(false);
  };

  const resetCalculator = () => {
    setSelectedSubstance(null);
    setCurrent("");
    setHours("");
    setMinutes("");
    setSeconds("");
    setEfficiency([100]);
    setResults(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Electrolysis Calculator</h1>
        <p className="text-muted-foreground">
          Calculate theoretical yield in electrolysis using Faraday&apos;s laws.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calculator Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Theoretical Yield Calculator
              </CardTitle>
              <CardDescription>
                Calculate the theoretical yield using the formula: m = (M · I · t) / (n · F)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Substance Selection */}
              <div className="space-y-2">
                <Label htmlFor="substance">Substance / Product</Label>
                <Select onValueChange={(value) => {
                  const substance = substances.find(s => s.formula === value);
                  setSelectedSubstance(substance || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a substance" />
                  </SelectTrigger>
                  <SelectContent>
                    {substances.map((substance) => (
                      <SelectItem key={substance.formula} value={substance.formula}>
                        {substance.name} ({substance.formula})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSubstance && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Molar Mass:</strong> {selectedSubstance.molarMass} g/mol</div>
                      <div><strong>Valency (n):</strong> {selectedSubstance.valency}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{selectedSubstance.description}</p>
                  </div>
                )}
              </div>

              {/* Current Input */}
              <div className="space-y-2">
                <Label htmlFor="current" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Current (Amps)
                </Label>
                <Input
                  id="current"
                  type="number"
                  placeholder="Enter current in Amperes"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Duration
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="hours" className="text-xs">Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minutes" className="text-xs">Minutes</Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seconds" className="text-xs">Seconds</Label>
                    <Input
                      id="seconds"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Efficiency Slider */}
              <div className="space-y-2">
                <Label>Current Efficiency: {efficiency[0]}%</Label>
                <Slider
                  value={efficiency}
                  onValueChange={setEfficiency}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={calculateYield}
                  disabled={!selectedSubstance || !current || (!hours && !minutes && !seconds) || isCalculating}
                  className="flex-1"
                >
                  {isCalculating ? "Calculating..." : "Calculate Yield"}
                </Button>
                <Button variant="outline" onClick={resetCalculator}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading Animation */}
          {isCalculating && <LoadingAnimation />}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="w-5 h-5" />
                  Calculation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Theoretical Yield</div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {results.theoreticalYield.toFixed(3)} g
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Moles Produced</div>
                    <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {results.molesProduced.toExponential(3)}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Charge</div>
                    <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {results.totalCharge.toFixed(0)} C
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Electrons Transferred</div>
                    <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                      {results.electronsTransferred.toExponential(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chemistry Behind It */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Atom className="w-5 h-5" />
                The Chemistry Behind It
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Faraday&apos;s First Law</h4>
                <p className="text-sm text-muted-foreground">
                  The mass of a substance produced at an electrode during electrolysis is directly proportional to the quantity of electricity passed through the electrolyte.
                </p>
                <div className="mt-2 p-3 bg-muted rounded font-mono text-sm">
                  m ∝ Q<br />
                  m = (M × Q) / (n × F)
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Dimensional Analysis (Train Tracks)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Current (I)</Badge>
                    <span>×</span>
                    <Badge variant="outline">Time (t)</Badge>
                    <span>=</span>
                    <Badge variant="outline">Charge (Q)</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Charge (Q)</Badge>
                    <span>÷</span>
                    <Badge variant="outline">Faraday (F)</Badge>
                    <span>=</span>
                    <Badge variant="outline">Moles of e⁻</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Moles of e⁻</Badge>
                    <span>÷</span>
                    <Badge variant="outline">Valency (n)</Badge>
                    <span>=</span>
                    <Badge variant="outline">Moles of Product</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Moles of Product</Badge>
                    <span>×</span>
                    <Badge variant="outline">Molar Mass (M)</Badge>
                    <span>=</span>
                    <Badge variant="outline">Mass (m)</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
