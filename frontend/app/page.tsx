export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <section className="text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          AI-Powered Chemistry Workstation
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          SMILES conversion • Molecular analysis • Electrolysis calculator • Retrosynthesis planning 
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/converter">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-medium">
              Start with SMILES Converter →
            </button>
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="border rounded-lg p-6 bg-card">
          <h3 className="text-xl font-semibold mb-3">Core Tools</h3>
          <p className="text-muted-foreground">SMILES ↔ Structure, InChI, properties, MOL file export</p>
        </div>
      </section>
    </div>
  );
}
