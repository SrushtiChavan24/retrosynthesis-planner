"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadElementsFromCSV, Element } from "@/lib/periodic-table-data";

interface ElementCardProps {
  element: Element;
  onClick: (element: Element) => void;
  isSelected: boolean;
}

function ElementCard({ element, onClick, isSelected }: ElementCardProps) {
  return (
    <button
      onClick={() => onClick(element)}
      className={`
        w-16 h-16 border rounded-md text-xs font-medium transition-all duration-200
        hover:scale-105 hover:shadow-lg flex flex-col items-center justify-center
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
      `}
      style={{
        backgroundColor: element.color + '20',
        borderColor: element.color,
      }}
    >
      <div className="font-bold text-sm">{element.symbol}</div>
      <div className="text-xs opacity-75">{element.atomicNumber}</div>
    </button>
  );
}

function PeriodicTableGrid({ selectedElement, onElementClick, elements }: {
  selectedElement: Element | null;
  onElementClick: (element: Element) => void;
  elements: Element[];
}) {
  // Create main periodic table grid (18 columns x 7 rows)
  // Plus separate rows for lanthanides and actinides
  const mainGrid = Array(7).fill(null).map(() => Array(18).fill(null));
  const lanthanides: Element[] = [];
  const actinides: Element[] = [];

  elements.forEach(element => {
    if (element.atomicNumber >= 57 && element.atomicNumber <= 71) {
      // Lanthanides
      lanthanides.push(element);
    } else if (element.atomicNumber >= 89 && element.atomicNumber <= 103) {
      // Actinides
      actinides.push(element);
    } else if (element.period <= 7) {
      const row = element.period - 1;
      const col = element.group - 1;
      if (row < 7 && col < 18 && col >= 0) {
        mainGrid[row][col] = element;
      }
    }
  });

  // Sort lanthanides and actinides by atomic number
  lanthanides.sort((a, b) => a.atomicNumber - b.atomicNumber);
  actinides.sort((a, b) => a.atomicNumber - b.atomicNumber);

  return (
    <div className="space-y-4">
      {/* Main Periodic Table */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-18 gap-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-w-max">
          {mainGrid.map((row, rowIndex) => (
            <div key={rowIndex} className="contents">
              {row.map((element, colIndex) => (
                <div key={colIndex} className="w-16 h-16">
                  {element ? (
                    <ElementCard
                      element={element}
                      onClick={onElementClick}
                      isSelected={selectedElement?.atomicNumber === element.atomicNumber}
                    />
                  ) : (
                    <div className="w-16 h-16" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Lanthanides Row */}
      {lanthanides.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground ml-4">
            Lanthanides (Period 6, Elements 57-71)
          </p>
          <div className="overflow-x-auto">
            <div className="flex gap-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-w-max ml-4">
              {lanthanides.map(element => (
                <ElementCard
                  key={element.atomicNumber}
                  element={element}
                  onClick={onElementClick}
                  isSelected={selectedElement?.atomicNumber === element.atomicNumber}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actinides Row */}
      {actinides.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground ml-4">
            Actinides (Period 7, Elements 89-103)
          </p>
          <div className="overflow-x-auto">
            <div className="flex gap-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-w-max ml-4">
              {actinides.map(element => (
                <ElementCard
                  key={element.atomicNumber}
                  element={element}
                  onClick={onElementClick}
                  isSelected={selectedElement?.atomicNumber === element.atomicNumber}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorLegend() {
  const categories = [
    { name: 'Alkali Metals', color: '#ffd93d' },
    { name: 'Alkaline Earth Metals', color: '#6bcf7f' },
    { name: 'Transition Metals', color: '#ff6b9d' },
    { name: 'Post-transition Metals', color: '#c084fc' },
    { name: 'Metalloids', color: '#4d96ff' },
    { name: 'Nonmetals', color: '#ff6b6b' },
    { name: 'Halogens', color: '#ff9500' },
    { name: 'Noble Gases', color: '#4ecdc4' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Element Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {categories.map(category => (
            <div key={category.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm">{category.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ElementDetailsPanel({ element }: { element: Element | null }) {
  if (!element) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Click on an element to see its details
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: element.color }}
          >
            {element.symbol}
          </div>
          <div>
            <div className="text-2xl font-bold">{element.name}</div>
            <div className="text-sm text-muted-foreground">
              Atomic Number: {element.atomicNumber}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium">Category</div>
            <Badge variant="secondary" style={{ backgroundColor: element.color + '20', color: element.color }}>
              {element.category}
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium">Atomic Mass</div>
            <div className="font-mono">{element.atomicMass.toFixed(3)} u</div>
          </div>
          <div>
            <div className="text-sm font-medium">Group</div>
            <div>{element.group}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Period</div>
            <div>{element.period}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Appearance</div>
            <div>{element.appearance ?? element.state}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Block</div>
            <div className="font-mono">{element.block}</div>
          </div>
          <div>
            <div className="text-sm font-medium">State</div>
            <div className="capitalize">{element.state}</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Electron Configuration</div>
          <div className="font-mono text-sm bg-muted p-2 rounded">
            {element.electronConfiguration}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Chemical Properties</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {element.electronegativity && (
              <div>
                <span className="font-medium">Electronegativity:</span> {element.electronegativity}
              </div>
            )}
            {element.atomicRadius && (
              <div>
                <span className="font-medium">Atomic Radius:</span> {element.atomicRadius} pm
              </div>
            )}
            {element.ionizationEnergy && (
              <div>
                <span className="font-medium">Ionization Energy:</span> {element.ionizationEnergy} kJ/mol
              </div>
            )}
            {element.electronAffinity && (
              <div>
                <span className="font-medium">Electron Affinity:</span> {element.electronAffinity} kJ/mol
              </div>
            )}
            <div>
              <span className="font-medium">Valence Electrons:</span> {element.valenceElectrons}
            </div>
            <div>
              <span className="font-medium">Reactivity:</span> {element.reactivity}
            </div>
          </div>
        </div>

        {element.discoveryYear && (
          <div>
            <div className="text-sm font-medium mb-2">Discovery</div>
            <div className="text-sm">
              Discovered by {element.discoveredBy} in {element.discoveryYear}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium mb-2">Description</div>
          <p className="text-sm text-muted-foreground">{element.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function buildTrendPoints(values: number[], width = 300, height = 120) {
  const filtered = values.map(v => (v == null || Number.isNaN(v) ? NaN : v));
  const validValues = filtered.filter(v => !Number.isNaN(v));
  if (validValues.length === 0) return "";
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = Math.max(max - min, 1);

  return filtered
    .map((value, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = value == null || Number.isNaN(value)
        ? height
        : height - ((value - min) / range) * (height * 0.8) - 10;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function TrendChart({
  title,
  values,
  unit,
  color,
}: {
  title: string;
  values: number[];
  unit: string;
  color: string;
}) {
  const points = buildTrendPoints(values);
  const filtered = values.filter(v => !Number.isNaN(v));
  const min = filtered.length ? Math.min(...filtered) : 0;
  const max = filtered.length ? Math.max(...filtered) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {title} for all elements (data source: PeriodicTableCSV / public/data)
        </div>
        <div className="h-32 bg-slate-50 rounded-lg border p-2">
          <svg viewBox="0 0 300 120" className="w-full h-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth={2}
              points={points}
            />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><strong>Min</strong>: {Number.isNaN(min) ? "N/A" : min.toFixed(2)} {unit}</div>
          <div><strong>Max</strong>: {Number.isNaN(max) ? "N/A" : max.toFixed(2)} {unit}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodicTableView({ elements }: {
  elements: Element[];
}) {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Periodic Table</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any element to view its detailed information including atomic mass, electron configuration, and discovery history
          </p>
        </CardHeader>
        <CardContent>
          <PeriodicTableGrid
            selectedElement={selectedElement}
            onElementClick={setSelectedElement}
            elements={elements}
          />
        </CardContent>
      </Card>

      <ColorLegend />

      {selectedElement && (
        <ElementDetailsPanel element={selectedElement} />
      )}
    </div>
  );
}

function PeriodicTrendsView({ elements }: {
  elements: Element[];
}) {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  
  const trendData = {
    electronegativity: elements.map(e => e.electronegativity ?? NaN),
    ionizationEnergy: elements.map(e => {
      if (typeof e.ionizationEnergy === 'number') return e.ionizationEnergy;
      if (typeof e.ionizationEnergy === 'string') {
        const match = (e.ionizationEnergy as string).match(/\[(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : NaN;
      }
      return NaN;
    }),
    electronAffinity: elements.map(e => e.electronAffinity ?? NaN),
    atomicRadius: elements.map(e => e.atomicRadius ?? NaN),
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Periodic Trends Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualize how element properties change across the periodic table
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li><strong>Atomic Radius:</strong> Decreases across a period (left to right); increases down a group</li>
            <li><strong>Ionization Energy:</strong> Generally increases across a period; decreases down a group</li>
            <li><strong>Electronegativity:</strong> Generally increases across a period; decreases down a group</li>
            <li><strong>Electron Affinity:</strong> Generally increases across a period; decreases down a group</li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <TrendChart
          title="Electronegativity (Pauling Scale)"
          values={trendData.electronegativity}
          unit="scale units"
          color="#3b82f6"
        />
        <TrendChart
          title="Ionization Energy"
          values={trendData.ionizationEnergy}
          unit="kJ/mol"
          color="#ef4444"
        />
        <TrendChart
          title="Electron Affinity"
          values={trendData.electronAffinity}
          unit="kJ/mol"
          color="#8b5cf6"
        />
        <TrendChart
          title="Atomic Radius"
          values={trendData.atomicRadius}
          unit="pm"
          color="#10b981"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Element Property Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-base">Electronegativity (Pauling)</h4>
              <div>
                Count: {trendData.electronegativity.filter(v => !Number.isNaN(v)).length}
              </div>
              <div>
                Average:{" "}
                {(
                  trendData.electronegativity.filter(v => !Number.isNaN(v)).reduce((a, b) => a + b, 0) /
                  trendData.electronegativity.filter(v => !Number.isNaN(v)).length
                ).toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-base">Ionization Energy (kJ/mol)</h4>
              <div>
                Count: {trendData.ionizationEnergy.filter(v => !Number.isNaN(v)).length}
              </div>
              <div>
                Average:{" "}
                {(
                  trendData.ionizationEnergy.filter(v => !Number.isNaN(v)).reduce((a: number, b) => a + b, 0) /
                  trendData.ionizationEnergy.filter(v => !Number.isNaN(v)).length
                ).toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-base">Electron Affinity (kJ/mol)</h4>
              <div>
                Count: {trendData.electronAffinity.filter(v => !Number.isNaN(v)).length}
              </div>
              <div>
                Average:{" "}
                {(
                  trendData.electronAffinity.filter(v => !Number.isNaN(v)).reduce((a, b) => a + b, 0) /
                  trendData.electronAffinity.filter(v => !Number.isNaN(v)).length
                ).toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-base">Atomic Radius (pm)</h4>
              <div>
                Count: {trendData.atomicRadius.filter(v => !Number.isNaN(v)).length}
              </div>
              <div>
                Average:{" "}
                {(
                  trendData.atomicRadius.filter(v => !Number.isNaN(v)).reduce((a, b) => a + b, 0) /
                  trendData.atomicRadius.filter(v => !Number.isNaN(v)).length
                ).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Element to View Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on the periodic table below to select an element and view its properties
            </p>
          </CardHeader>
          <CardContent>
            <PeriodicTableGrid
              selectedElement={selectedElement}
              onElementClick={setSelectedElement}
              elements={elements}
            />
          </CardContent>
        </Card>
      </div>

      {selectedElement && (
        <ElementDetailsPanel element={selectedElement} />
      )}
    </div>
  );
}

function ElementsPropertyView({ 
  elements, 
  selectedCategory, 
  onCategorySelect 
}: { 
  elements: Element[]; 
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}) {
  const categories = [
    { id: 'alkali metal', name: 'Alkali Metals', color: '#ffd93d' },
    { id: 'alkaline earth metal', name: 'Alkaline Earth Metals', color: '#6bcf7f' },
    { id: 'transition metal', name: 'Transition Metals', color: '#ff6b9d' },
    { id: 'post-transition metal', name: 'Post-transition Metals', color: '#c084fc' },
    { id: 'metalloid', name: 'Metalloids', color: '#4d96ff' },
    { id: 'nonmetal', name: 'Nonmetals', color: '#ff6b6b' },
    { id: 'polyatomic nonmetal', name: 'Polyatomic Nonmetals', color: '#ff8c42' },
    { id: 'diatomic nonmetal', name: 'Diatomic Nonmetals', color: '#ff5a5f' },
    { id: 'halogen', name: 'Halogens', color: '#ff9500' },
    { id: 'noble gas', name: 'Noble Gases', color: '#4ecdc4' },
  ];

  const elementsByCategory = categories.map(cat => ({
    ...cat,
    elements: elements
      .filter(el => {
        if (!el.category) return false;
        const normCategory = el.category.toLowerCase();
        if (cat.id === 'nonmetal') {
          return normCategory === 'nonmetal' || normCategory === 'diatomic nonmetal' || normCategory === 'polyatomic nonmetal';
        }
        if (cat.id === 'diatomic nonmetal') {
          return normCategory === 'diatomic nonmetal';
        }
        if (cat.id === 'polyatomic nonmetal') {
          return normCategory === 'polyatomic nonmetal';
        }
        return normCategory === cat.id;
      })
      .sort((a, b) => a.atomicNumber - b.atomicNumber),
  })).filter(cat => cat.elements.length > 0);

  const selectedCategoryData = elementsByCategory.find(cat => cat.id === selectedCategory);

  if (selectedCategory && selectedCategoryData) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onCategorySelect(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-4"
        >
          ← Back to Categories
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-12 h-12 rounded-lg" 
            style={{ backgroundColor: selectedCategoryData.color }}
          />
          <div>
            <h2 className="text-2xl font-bold">{selectedCategory}</h2>
            <p className="text-muted-foreground">{selectedCategoryData.elements.length} elements</p>
          </div>
        </div>

        <div className="space-y-4">
          {selectedCategoryData.elements.map(element => (
            <Card key={element.atomicNumber} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: element.color }}
                      >
                        {element.symbol}
                      </div>
                      <div>
                        <div className="text-xl font-bold">{element.name}</div>
                        <div className="text-sm text-muted-foreground">#{element.atomicNumber}</div>
                      </div>
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">Atomic Mass</div>
                    <div className="text-lg font-bold">{element.atomicMass.toFixed(3)}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Basic Properties Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {element.phase && (
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground font-medium">Phase</div>
                      <div className="text-sm font-semibold capitalize">{element.phase}</div>
                    </div>
                  )}
                  {element.density !== undefined && (
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground font-medium">Density</div>
                      <div className="text-sm font-semibold">{element.density.toFixed(4)} g/cm³</div>
                    </div>
                  )}
                  {element.meltingPoint !== undefined && (
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground font-medium">Melting Point</div>
                      <div className="text-sm font-semibold">{element.meltingPoint.toFixed(2)} K</div>
                    </div>
                  )}
                  {element.boilingPoint !== undefined && (
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground font-medium">Boiling Point</div>
                      <div className="text-sm font-semibold">{element.boilingPoint.toFixed(2)} K</div>
                    </div>
                  )}
                  {element.molarHeat !== undefined && (
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground font-medium">Molar Heat</div>
                      <div className="text-sm font-semibold">{element.molarHeat.toFixed(3)} J/mol·K</div>
                    </div>
                  )}
                  {element.block && (
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground font-medium">Block</div>
                      <div className="text-sm font-semibold uppercase">{element.block}</div>
                    </div>
                  )}
                </div>

                {/* Periodic Properties */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Periodic Properties</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {element.electronegativity !== undefined && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        <div className="text-xs text-muted-foreground font-medium">Electronegativity</div>
                        <div className="text-sm font-semibold">{element.electronegativity.toFixed(2)}</div>
                      </div>
                    )}
                    {element.ionizationEnergy && (
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                        <div className="text-xs text-muted-foreground font-medium">Ionization Energy</div>
                        <div className="text-sm font-semibold">{element.ionizationEnergy}</div>
                      </div>
                    )}
                    {element.electronAffinity !== undefined && (
                      <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded">
                        <div className="text-xs text-muted-foreground font-medium">Electron Affinity</div>
                        <div className="text-sm font-semibold">{element.electronAffinity.toFixed(2)} kJ/mol</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-3">
                  {element.category && (
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Category</div>
                      <div className="text-sm font-semibold capitalize">{element.category}</div>
                    </div>
                  )}
                  {element.namedBy && (
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Named By</div>
                      <div className="text-sm font-semibold">{element.namedBy}</div>
                    </div>
                  )}
                  {element.source && (
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Source</div>
                      <div className="text-sm font-semibold">{element.source}</div>
                    </div>
                  )}
                  {element.shells && (
                    <div className="col-span-full">
                      <div className="text-xs text-muted-foreground font-medium">Electron Shells</div>
                      <div className="text-sm font-semibold">{element.shells}</div>
                    </div>
                  )}
                  {element.electronConfiguration && (
                    <div className="col-span-full">
                      <div className="text-xs text-muted-foreground font-medium">Electron Configuration</div>
                      <div className="text-sm font-mono bg-muted p-2 rounded">{element.electronConfiguration}</div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {element.description && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Summary</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{element.description}</p>
                  </div>
                )}

                {/* Image if available */}
                {element.imageUrl && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">{element.imageTitle || 'Image'}</div>
                    <img src={element.imageUrl} alt={element.name} className="max-w-full h-auto rounded" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show category blocks
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Element Categories</h1>
        <p className="text-muted-foreground text-lg">Click on a category to view all elements and their properties</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {elementsByCategory.map(cat => (
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.id)}
            className="p-6 rounded-lg border-2 hover:shadow-lg transition-all duration-200 text-left group"
            style={{
              borderColor: cat.color,
              backgroundColor: cat.color + '15',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg mb-3 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: cat.color }}
            />
            <h3 className="font-bold text-lg mb-1">{cat.name}</h3>
            <p className="text-muted-foreground text-sm">{cat.elements.length} elements</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PeriodicTablePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'property' | 'trends'>('property');
  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedElements = await loadElementsFromCSV();
        setElements(loadedElements);
      } catch (error) {
        console.error('Failed to load elements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Periodic Table...</h1>
          <p className="text-muted-foreground">Reading data from CSV file...</p>
        </div>
      </div>
    );
  }

  if (elements.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Error Loading Data</h1>
          <p className="text-muted-foreground">Could not load periodic table data. Please check if the CSV file is in place.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Periodic Table Explorer</h1>
        <p className="text-muted-foreground">Explore all 119 elements with interactive views</p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap justify-center">
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
        >
          Periodic Table
        </Button>
        <Button
          variant={viewMode === 'property' ? 'default' : 'outline'}
          onClick={() => setViewMode('property')}
        >
          Elements Property
        </Button>
        <Button
          variant={viewMode === 'trends' ? 'default' : 'outline'}
          onClick={() => setViewMode('trends')}
        >
          Periodic Trends
        </Button>
      </div>

      {viewMode === 'table' && (
        <PeriodicTableView elements={elements} />
      )}

      {viewMode === 'property' && (
        <ElementsPropertyView elements={elements} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
      )}

      {viewMode === 'trends' && (
        <PeriodicTrendsView elements={elements} />
      )}
    </div>
  );
}

