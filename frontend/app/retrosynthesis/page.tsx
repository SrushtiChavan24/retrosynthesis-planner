"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_SMILES_LENGTH = 300;

interface ReactionStep {
  product: string;
  probability: number;
  reactants: string[];
}

interface PlanResult {
  success: boolean;
  smiles: string;
  already_buyable?: boolean;
  routes: ReactionStep[];
  message?: string;
  route_cost?: number;
  route_len?: number;
  time?: number;
  iter?: number;
}

export default function RetrosynthesisPage() {
  const [input, setInput] = useState("CCCC1=NN(C)C(=O)c2[nH]cnc21");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<PlanResult>("/retrosynthesis/plan", {
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
          Neural-guided synthesis route planning powered by Retro* — finds
          optimal pathways from target molecule back to purchasable starting materials.
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Target Molecule</CardTitle>
          <CardDescription>Enter the SMILES string of the molecule you want to synthesize.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smiles">Target SMILES</Label>
            <Input
              id="smiles"
              value={input}
              onChange={(e) => {
                if (e.target.value.length > MAX_SMILES_LENGTH) {
                  setError(`Max ${MAX_SMILES_LENGTH} characters`);
                  return;
                }
                setInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="e.g. CCCC1=NN(C)C(=O)c2[nH]cnc21"
              className="font-mono"
            />
            <div className="text-xs text-right text-muted-foreground">
              {input.length} / {MAX_SMILES_LENGTH}
            </div>
          </div>

          {/* Quick examples */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Try:</span>
            {[
              { label: "Aspirin",      smiles: "CC(=O)Oc1ccccc1C(=O)O" },
              { label: "Ibuprofen",    smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O" },
              { label: "Caffeine",     smiles: "Cn1cnc2c1c(=O)n(c(=O)n2C)C" },
              { label: "Paracetamol",  smiles: "CC(=O)Nc1ccc(O)cc1" },
              { label: "Test (3-step)", smiles: "CCCC1=NN(C)C(=O)c2[nH]cnc21" },
            ].map((ex) => (
              <Button key={ex.label} variant="outline"
                onClick={() => { setInput(ex.smiles); setError(null); }}
                className="text-xs h-7 px-2">
                {ex.label}
              </Button>
            ))}
          </div>

          <Button onClick={handleAnalyze} disabled={loading || !input.trim()} className="w-full">
            {loading ? "Running Retro* search..." : "Plan Retrosynthesis"}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/30 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Searching for synthesis routes...</CardTitle>
            <CardDescription>Retro* is exploring the AND-OR tree. This may take 30–60 seconds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Retrosynthesis Results</CardTitle>
            <CardDescription>
              Target: <code className="font-mono text-xs">{result.smiles}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>

            {/* Failed */}
            {!result.success && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">No Route Found</h3>
                <p className="text-muted-foreground text-sm">{result.message}</p>
              </div>
            )}

            {/* Already buyable */}
            {result.success && result.already_buyable && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 
                              dark:border-blue-800 rounded-lg p-6 text-center">
                <div className="text-5xl mb-3">🛒</div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Already Purchasable
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                  {result.message}
                </p>
                <code className="bg-white dark:bg-gray-900 border rounded px-3 py-1 text-xs font-mono">
                  {result.smiles}
                </code>
                <p className="text-xs text-muted-foreground mt-3">
                  Try a more complex molecule to see a multi-step synthesis route.
                </p>
              </div>
            )}

            {/* Multi-step route */}
            {result.success && !result.already_buyable && result.routes.length > 0 && (
              <div className="space-y-4">

                {/* Stats */}
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 
                                dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      Route found — {result.route_len} reaction step{result.route_len !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-green-700 dark:text-green-300">
                    <span>Total cost: {result.route_cost?.toFixed(3)}</span>
                    <span>Iterations: {result.iter}</span>
                    <span>Time: {result.time?.toFixed(2)}s</span>
                  </div>
                </div>

                {/* Steps */}
                {result.routes.map((step: ReactionStep, i: number) => (
                  <div key={i}
                    className="border dark:border-gray-700 rounded-lg p-4 space-y-3">

                    {/* Step header */}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">
                        Step {i + 1}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        p = {step.probability}
                      </span>
                    </div>

                    <div className="border-t dark:border-gray-700" />

                    {/* Reactants */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Starting materials
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {step.reactants.map((r: string, j: number) => (
                          <code key={j}
                            className="text-xs bg-blue-50 dark:bg-blue-950/30 border
                                       border-blue-200 dark:border-blue-800
                                       px-2 py-1 rounded font-mono">
                            🧪 {r}
                          </code>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-center text-muted-foreground font-bold text-xl">
                      ↓
                    </div>

                    {/* Product */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Product
                      </Label>
                      <code
                        className="text-xs bg-green-50 dark:bg-green-950/30 border
                                   border-green-200 dark:border-green-800
                                   px-2 py-1 rounded font-mono block w-full">
                        ✅ {step.product}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
// "use client";

// import { useState } from "react";
// import { apiFetch } from "@/lib/api";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";

// const MAX_SMILES_LENGTH = 300;

// interface RouteNode {
//   mol: string;
//   children: RouteNode[];
// }

// interface PlanResult {
//   success: boolean;
//   smiles: string;
//   already_buyable?: boolean;
//   routes: any[];
//   message?: string;
//   route_cost?: number;
//   route_len?: number;
//   time?: number;
//   iter?: number;
// }

// function RouteTree({ node, depth = 0 }: { node: RouteNode; depth?: number }) {
//   const isBuyable = node.children.length === 0;
//   return (
//     <div style={{ marginLeft: depth * 20 }} className="my-1">
//       <div className="flex items-center gap-2">
//         <span className="text-xs text-muted-foreground">
//           {depth === 0 ? "🎯" : isBuyable ? "🟢" : "⚗️"}
//         </span>
//         <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
//           {node.mol}
//         </code>
//         {isBuyable && (
//           <span className="text-xs text-green-600 dark:text-green-400 font-medium">
//             buyable
//           </span>
//         )}
//       </div>
//       {node.children.map((child, i) => (
//         <RouteTree key={i} node={child} depth={depth + 1} />
//       ))}
//     </div>
//   );
// }

// export default function RetrosynthesisPage() {
//   const [input, setInput] = useState("CC(=O)Oc1ccccc1C(=O)O");
//   const [result, setResult] = useState<PlanResult | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleAnalyze = async () => {
//     setLoading(true);
//     setError(null);
//     setResult(null);

//     try {
//       const data = await apiFetch<PlanResult>("/retrosynthesis/plan", {
//         method: "POST",
//         body: JSON.stringify({ smiles: input }),
//       });
//       setResult(data);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto space-y-8">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold mb-3">Retrosynthesis Planner</h1>
//         <p className="text-muted-foreground">
//           Neural-guided synthesis route planning powered by Retro* — finds
//           optimal pathways from target molecule back to purchasable starting materials.
//         </p>
//       </div>

//       {/* Input card */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Target Molecule</CardTitle>
//           <CardDescription>
//             Enter the SMILES string of the molecule you want to synthesize.
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="smiles">Target SMILES</Label>
//             <Input
//               id="smiles"
//               value={input}
//               onChange={(e) => {
//                 const val = e.target.value;
//                 if (val.length > MAX_SMILES_LENGTH) {
//                   setError(`Input too long (max ${MAX_SMILES_LENGTH} characters)`);
//                   return;
//                 }
//                 setInput(val);
//                 setError(null);
//               }}
//               placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
//               className="font-mono"
//               maxLength={MAX_SMILES_LENGTH + 10}
//               onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
//             />
//             <div className="text-xs text-right text-muted-foreground">
//               {input.length} / {MAX_SMILES_LENGTH} characters
//               {input.length > MAX_SMILES_LENGTH * 0.9 && " (approaching limit)"}
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             <span className="text-xs text-muted-foreground self-center">Try:</span>
//             {[
//               { label: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
//               { label: "Ibuprofen", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O" },
//               { label: "Caffeine", smiles: "Cn1cnc2c1c(=O)n(c(=O)n2C)C" },
//               { label: "Paracetamol", smiles: "CC(=O)Nc1ccc(O)cc1" },
//             ].map((ex) => (
//               <Button
//                 key={ex.label}
//                 variant="outline"
//                 onClick={() => { setInput(ex.smiles); setError(null); }}
//                 className="text-xs font-mono h-7 px-2"
//               >
//                 {ex.label}
//               </Button>
//             ))}
//           </div>

//           <Button
//             onClick={handleAnalyze}
//             disabled={loading || !input.trim()}
//             className="w-full"
//           >
//             {loading ? "Running Retro* search..." : "Plan Retrosynthesis"}
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Error */}
//       {error && (
//         <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/30">
//           {error}
//         </div>
//       )}

//       {/* Loading skeleton */}
//       {loading && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Searching for synthesis routes...</CardTitle>
//             <CardDescription>
//               Retro* is exploring the AND-OR tree. This may take 30–60 seconds.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <Skeleton className="h-4 w-3/4" />
//               <Skeleton className="h-4 w-1/2" />
//               <div className="grid md:grid-cols-2 gap-4">
//                 <Skeleton className="h-20 w-full" />
//                 <Skeleton className="h-20 w-full" />
//               </div>
//               <Skeleton className="h-32 w-full" />
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Results */}
//       {result && !loading && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Retrosynthesis Results</CardTitle>
//             <CardDescription>
//               Target: <code className="font-mono text-xs">{result.smiles}</code>
//             </CardDescription>
//           </CardHeader>
//           <CardContent>

//             {/* Case 1 — backend error */}
//             {!result.success && (
//               <div className="text-center py-8">
//                 <div className="text-6xl mb-4">🔍</div>
//                 <h3 className="text-lg font-medium mb-2">No Synthesis Route Found</h3>
//                 <p className="text-muted-foreground text-sm">
//                   {result.message || "Retro* could not find a viable route. Try a different molecule."}
//                 </p>
//               </div>
//             )}

//             {/* Case 2 — molecule is already purchasable */}
//             {result.success && result.already_buyable && (
//               <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 
//                               dark:border-blue-800 rounded-lg p-6 text-center">
//                 <div className="text-5xl mb-3">🛒</div>
//                 <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
//                   Already Purchasable
//                 </h3>
//                 <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
//                   {result.message}
//                 </p>
//                 <code className="bg-white dark:bg-gray-900 border rounded px-3 py-1 
//                                  text-xs font-mono">
//                   {result.smiles}
//                 </code>
//                 <p className="text-xs text-muted-foreground mt-3">
//                   Try a more complex molecule to see a multi-step synthesis route.
//                 </p>
//               </div>
//             )}

//            {/* Case 3 — multi-step routes found */}
// {result.success && !result.already_buyable && result.routes.length > 0 && (
//   <div className="space-y-4">

//     {/* Stats banner */}
//     <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 
//                     dark:border-green-800 rounded-lg p-4">
//       <div className="flex items-center gap-2 mb-1">
//         <div className="w-2 h-2 bg-green-500 rounded-full" />
//         <span className="font-medium text-green-800 dark:text-green-200">
//           Route found — {result.route_len} reaction step{result.route_len !== 1 ? "s" : ""}
//         </span>
//       </div>
//       <div className="flex gap-4 text-xs text-green-700 dark:text-green-300 mt-1">
//         <span>Cost: {result.route_cost?.toFixed(3)}</span>
//         <span>Iterations: {result.iter}</span>
//         <span>Time: {result.time?.toFixed(2)}s</span>
//       </div>
//     </div>

//     {/* Step-by-step reaction cards */}
//     {result.routes.map((step: any, i: number) => (
//       <div key={i} className="border dark:border-gray-700 rounded-lg p-4 space-y-3">

//         {/* Step header */}
//         <div className="flex justify-between items-center">
//           <span className="font-semibold text-sm">Step {i + 1}</span>
//           <span className="text-xs bg-muted px-2 py-1 rounded font-mono">
//             p = {step.probability}
//           </span>
//         </div>

//         <div className="border-t dark:border-gray-700" />

//         {/* Reactants → Product */}
//         <div className="space-y-2">

//           {/* Reactants */}
//           <div>
//             <Label className="text-xs text-muted-foreground mb-1 block">
//               Starting materials
//             </Label>
//             <div className="flex flex-wrap gap-2">
//               {step.reactants.map((r: string, j: number) => (
//                 <code key={j}
//                   className="text-xs bg-blue-50 dark:bg-blue-950/30 border 
//                              border-blue-200 dark:border-blue-800 px-2 py-1 
//                              rounded font-mono">
//                   🧪 {r}
//                 </code>
//               ))}
//             </div>
//           </div>

//           {/* Arrow */}
//           <div className="text-center text-muted-foreground text-lg">↓</div>

//           {/* Product */}
//           <div>
//             <Label className="text-xs text-muted-foreground mb-1 block">
//               Product
//             </Label>
//             <code className="text-xs bg-green-50 dark:bg-green-950/30 border 
//                              border-green-200 dark:border-green-800 px-2 py-1 
//                              rounded font-mono block">
//               ✅ {step.product}
//             </code>
//           </div>
//         </div>
//       </div>
//     ))}

//   </div>
// )}

//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }