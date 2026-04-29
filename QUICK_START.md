# 🚀 SMILES Converter Studio - Quick Start Guide

## One-Minute Setup

### Prerequisites
- Python 3.10+ (backend)
- Node.js 18+ (frontend)
- pip and npm installed

### Step 1: Start the Backend

```bash
cd d:\AI_CP\retrosynthesis-planner-main\backend
pip install -r requirements.txt
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Step 2: Start the Frontend

In a **new terminal**:
```bash
cd d:\AI_CP\retrosynthesis-planner-main\frontend
npm install  # (only first time)
npm run dev
```

Expected output:
```
> next dev
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
```

### Step 3: Open the Application

1. Open your browser
2. Navigate to: **http://localhost:3000/converter**
3. You should see the SMILES Converter Studio interface

## Test Examples

### Test 1: Simple Molecule (Water)
1. Input: `water` or `O` or `H2O`
2. Click "📊 Analyze Molecule"
3. You'll see:
   - ✅ Molecular structure
   - ✅ Properties (MW: 18.02 g/mol)
   - ✅ Bohr models for H and O
   - ✅ Reactivity analysis
   - ✅ Drug-likeness (PASS)

### Test 2: Drug Molecule (Aspirin)
1. Input: `aspirin`
2. Click "📊 Analyze Molecule"
3. Explore tabs:
   - *Structure*: See the benzene ring with carboxylic acid group
   - *Properties*: MW: 180.16, LogP: 1.19
   - *Bohr*: See electron configurations for C, H, O
   - *Reactivity*: Functional groups detected

### Test 3: Chemical Formula
1. Input: `C2H6O`
2. Click "📊 Analyze Molecule"
3. Backend auto-detects as formula and converts to ethanol
4. Same as SMILES: `CCO`

### Test 4: SMILES String
1. Input: `c1ccccc1` (benzene)
2. Click "📊 Analyze Molecule"
3. See hexagonal structure
4. Aromatic compound properties

### Test 5: Complex Molecule (Caffeine)
1. Input: `caffeine`
2. Explore all tabs
3. See high reactivity score
4. Complex Bohr model collection

## Feature Tour

### 🏗️ Structure Tab
- **What**: 2D molecular structure
- **Actions**:
  - ⬇️ Click "Download Structure (PNG)" to save image
  - Hover over structure to inspect bonds

### 📋 Properties Tab
- **Molecular Analysis**:
  - 9-box grid of molecular properties
  - Color-coded for easy reading
- **Molecular Identifiers**:
  - SMILES (click 📋 to copy)
  - InChI (click 📋 to copy)
  - InChI Key (click 📋 to copy)
  - MOL file V2000
- **Lipinski's Rule**:
  - Drug-likeness prediction
  - Violation list if not compatible

### ⚛️ Bohr Models Tab
- **For each element in molecule**:
  - Atomic number and count
  - Electron configuration
  - Electronegativity
  - 2D Bohr model thumbnail
  - Link to 3D GLB model (opens in new tab)
- **Try clicking on 3D model link**:
  - Opens interactive 3D visualization
  - Can view in dedicated 3D viewer

### ⚡ Reactivity Tab
- **Reactivity Level**: Classification (Low/Moderate/High/Very High)
- **Functional Groups**: Detected chemical groups
- **Molecular Flexibility**: Based on rotatable bonds
- **Polarity**: TPSA value
- **Drug-Likeness**: Pass/Fail with specific violations

## Search Feature

1. Type: `aspirin` (without analyzing yet)
2. Click "🔍 Search PubChem"
3. You'll see:
   - Official IUPAC name
   - Common name
   - SMILES string
   - Click "Select" to use it

## Keyboard Shortcuts

- **Ctrl+Enter** (or **Cmd+Enter** on Mac): Analyze from input box
- **Tab**: Navigate between elements
- **Click on links**: Open Bohr 3D models

## Troubleshooting

### Issue: "Could not resolve name/formula"
- **Solution**: Try SMILES format instead
- Example: Instead of "aspirin", try `CC(=O)Oc1ccccc1C(=O)O`

### Issue: Backend error when accessing `/chemistry/analyze-enhanced`
- **Cause**: Backend not running or periodic table CSV not found
- **Solution**: 
  1. Ensure backend is running on port 8000
  2. Check that `frontend/public/data/PeriodicTableCSV.csv` exists

### Issue: Bohr models not showing
- **Cause**: Images loading from external CDN or slow connection
- **Solution**: 
  1. Check browser network tab
  2. Reload page
  3. Try different molecule

### Issue: Large SMILES strings rejected
- **Limit**: 300 characters max
- **Solution**: Use shorter SMILES or chemical name instead

## API Testing (Advanced)

### Test Backend Directly

```bash
# Test basic conversion
curl -X POST http://localhost:8000/chemistry/convert \
  -H "Content-Type: application/json" \
  -d '{"smiles": "CCO"}'

# Test enhanced analysis
curl -X POST http://localhost:8000/chemistry/analyze-enhanced \
  -H "Content-Type: application/json" \
  -d '{"smiles": "CCO"}'

# Test search
curl -X POST http://localhost:8000/chemistry/search \
  -H "Content-Type: application/json" \
  -d '{"query": "aspirin", "max_results": 5}'

# Health check
curl http://localhost:8000/chemistry/health
```

## Performance Notes

⚡ **First load**: Slower (5-10s) due to:
- RDKit initialization
- Periodic table CSV loading
- Dependency setup

✨ **Subsequent loads**: Fast (1-2s)
- Cached data reduces processing time
- Periodic table data loaded once

## Example Molecules to Try

| Input | Type | Interest |
|-------|------|----------|
| water | Name | Simplest polar molecule |
| caffeine | Name | Complex alkaloid |
| aspirin | Name | Common drug |
| glucose | Name | Carbohydrate |
| CCO | SMILES | Ethanol |
| c1ccccc1 | SMILES | Benzene (aromatic) |
| C2H5OH | Formula | Ethanol (formula) |
| InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3 | InChI | Ethanol (InChI) |

## Next Steps

1. ✅ Explore all tabs for different molecules
2. ✅ Download structure images for presentations
3. ✅ Copy identifiers for literature citations
4. ✅ Use 3D models for teaching
5. ✅ Integrate with your chemistry workflow

## Documentation

For full details, see:
- **SMILES_CONVERTER_GUIDE.md** - Complete feature guide
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details

---

**Ready to explore molecular chemistry?** 🧪
Start with: `water` or `aspirin`
