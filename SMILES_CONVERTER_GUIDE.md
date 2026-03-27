# SMILES Converter Studio - Complete Guide

## Overview

The SMILES Converter Studio is a comprehensive molecular analysis tool that provides:

- **Molecular Structure Visualization** - 2D structure rendering with RDKit
- **Chemical Properties Analysis** - Comprehensive molecular descriptors
- **Reactivity Assessment** - Functional group detection and reactivity scoring
- **Bohr Model Visualization** - Element orbital diagrams and 3D models
- **Drug-Likeness Prediction** - Lipinski's Rule of Five compliance
- **Molecular Identifiers** - SMILES, InChI, InChI Key, and MOL blocks

## Features

### 1. Molecular Input

**Supported Input Formats:**
- **SMILES**: `CCO` (ethanol), `c1ccccc1` (benzene)
- **InChI**: `InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3`
- **Chemical Names**: `aspirin`, `caffeine`, `water`
- **Molecular Formulas**: `C2H6O`, `H2O`, `C8H10N4O2`

### 2. Molecular Structure Tab 🏗️

Displays a clean 2D molecular structure visualization rendered using RDKit with:
- **Download Option** - Export molecular structure as PNG
- **High Resolution** - Suitable for publications
- **Interactive View** - Zoom and inspect structure

**Example**: Input `CCO` (ethanol) shows the structure with:
```
    H H
    | |
H - C - C - O - H
    | |
    H H
```

### 3. Molecular Properties Tab 📋

Comprehensive molecular analysis including:

#### Physical Properties:
- **Molecular Weight** - g/mol (from atomic composition)
- **Exact Mass** - Precise mass in atomic mass units
- **Chemical Formula** - Molecular composition

#### Drug-Likeness Properties:
- **LogP** - Lipophilicity (partition coefficient)
- **H-Donors** - Hydrogen bond donor count
- **H-Acceptors** - Hydrogen bond acceptor count
- **TPSA** - Topological Polar Surface Area (Ų)

#### Structure Properties:
- **Rotatable Bonds** - Molecular flexibility indicator
- **Heavy Atoms** - Count of non-hydrogen atoms
- **Ring Count** - Number of rings in structure

#### Molecular Identifiers:
- **Canonical SMILES** - Standardized SMILES representation
- **InChI** - IUPAC International Chemical Identifier
- **InChI Key** - Fixed-length InChI hash
- **Molfile (V2000)** - 3D structure in MOL file format

### 4. Bohr Models Tab ⚛️

For each element in the molecule:

#### 2D Bohr Model:
- Visual electron shell diagram
- Shows electron distribution across shells
- Interactive thumbnail with full-size view option

#### 3D Model:
- GLB 3D model (Three.js compatible)
- Realistic electron orbital visualization
- Can be viewed in browser or external 3D viewers

#### Element Information:
- **Atomic Number (Z)** - Number of protons
- **Electron Configuration** - Full electron arrangement
- **Electronegativity** - Pauling scale value
- **Count** - How many of this element in molecule

**Example for ethanol (C2H6O):**
- Carbon (×2): 2D model, 3D model, electron config: 1s2 2s2 2p2
- Hydrogen (×6): 2D model, 3D model, electron config: 1s1
- Oxygen (×1): 2D model, 3D model, electron config: 1s2 2s2 2p4

### 5. Reactivity Tab ⚡

Comprehensive reactivity analysis:

#### Reactivity Level:
- **Low (Inert)** - No reactive functional groups
- **Moderate** - 1-2 reactive groups
- **High** - 3-4 reactive groups
- **Very High (Highly Reactive)** - 5+ reactive groups

#### Detected Functional Groups:
- Aldehydes (-CHO)
- Ketones (C=O)
- Carboxylic acids (-COOH)
- Esters (-COOR)
- Alcohols (-OH)
- Amines (-NR2)
- Phenols (Ar-OH)
- Amides (-CONR2)
- Nitro (-NO2)
- Thiols (-SH)
- Sulfides (-S-)
- Halogens (F, Cl, Br, I)

#### Molecular Properties:
- **Polarity (TPSA)** - Topological Polar Surface Area
- **Flexibility** - Low/Moderate/High rotatable bonds
- **Rotatable Bonds Count** - Each bond increases flexibility

#### Drug-Likeness (Lipinski's Rule of Five):
- **Status**: PASS/FAIL
- **Violations**: List of specific violations
- **Criteria**:
  - Molecular Weight ≤ 500 Da
  - LogP ≤ 5
  - H-Bond Donors ≤ 5
  - H-Bond Acceptors ≤ 10

## Usage Examples

### Example 1: Aspirin (Acetylsalicylic acid)

**Input**: `aspirin` (chemical name)
or `CC(=O)Oc1ccccc1C(=O)O` (SMILES)

**Results**:
- **Molecular Weight**: 180.16 g/mol
- **Drug-Likeness**: PASS
- **Reactivity Level**: High
- **Functional Groups**: Carboxylic Acid, Ester
- **Elements**: Carbon (9), Hydrogen (8), Oxygen (4)
- **Bohr Models**: Shows C, H, O electron configurations

### Example 2: Caffeine

**Input**: `caffeine` or `CN1C=NC2=C1C(=O)N(C(=O)N2C)C`

**Results**:
- **Molecular Weight**: 194.19 g/mol
- **Drug-Likeness**: PASS
- **Reactivity Level**: Moderate
- **Functional Groups**: Amide
- **Elements**: Carbon (8), Hydrogen (10), Nitrogen (4), Oxygen (2)

### Example 3: Water

**Input**: `water` or `O` or `H2O`

**Results**:
- **Molecular Weight**: 18.02 g/mol
- **Drug-Likeness**: PASS (meets all criteria)
- **Reactivity Level**: Moderate (Hydrogen bond donor and acceptor)
- **Functional Groups**: Alcohol
- **Elements**: Hydrogen (2), Oxygen (1)
- **Bohr Models**: Shows H and O orbital diagrams

## Technical Details

### Backend (Python/FastAPI)

**Dependencies**:
- `rdkit` - Molecular structure handling
- `fastapi` - REST API framework
- `pydantic` - Data validation
- `requests` - HTTP requests for PubChem lookup
- `pandas` - CSV parsing

**Endpoints**:

1. **POST /chemistry/analyze-enhanced**
   - Input: `{"smiles": "CCO"}`
   - Returns: Complete molecular analysis with all properties

2. **POST /chemistry/convert**
   - Input: `{"smiles": "CCO"}`
   - Returns: Basic conversion (structure + properties)

3. **POST /chemistry/search**
   - Input: `{"query": "aspirin", "max_results": 10}`
   - Returns: List of matching compounds from PubChem/local database

4. **GET /chemistry/health**
   - Returns: API health status and RDKit version

### Frontend (Next.js/TypeScript)

**Components**:
- Tab-based navigation (Structure, Properties, Bohr, Reactivity)
- Real-time molecular visualization
- Interactive Bohr model gallery
- Property tables with color coding
- Copy-to-clipboard functionality
- PubChem search integration

**Features**:
- Progressive enhancement (works without JS)
- Responsive design (mobile/tablet/desktop)
- Dark/Light theme support (via Tailwind CSS)
- Accessibility (ARIA labels, keyboard navigation)

## Data Source

### Periodic Table Data

The Bohr models and element information come from:
- **File**: `frontend/public/data/PeriodicTableCSV.csv`
- **Contains**: 118 elements with:
  - Bohr model images (2D PNG)
  - 3D models (GLB format)
  - Electron configuration
  - Electronegativity
  - Atomic properties

### Molecular Search

Compound information comes from:
1. **Local Database**: Pre-loaded chemical compounds
2. **PubChem API**: NIH public chemistry database
   - Name/formula resolution
   - SMILES generation
   - Structural similarity

## Keyboard Shortcuts

- **Ctrl+Enter** (Cmd+Enter on Mac) - Analyze molecule from input field
- **Tab** - Navigate between controls
- **Click element** - View Bohr model details

## Advanced Features

### SMILES Auto-Detection

Automatically detects input format:
- SMILES detection: Contains `C`, `N`, `O`, `[`, `(`, `=`, etc.
- InChI detection: Starts with `InChI=`
- Chemical name: Queried in PubChem database
- Formula: Matched in local database

### 3D Visualization

Bohr model 3D files are GLB models that can be viewed:
- In-browser with Three.js
- External 3D viewers (Babylon.js, etc.)
- Downloaded for use in presentations

### Export Options

- **Structure**: Download PNG image
- **Identifiers**: Copy SMILES/InChI/Key to clipboard
- **Molblock**: Copy V2000 MOL format
- **Properties**: Export as PDF/CSV (future)

## Troubleshooting

### Common Issues

**"Invalid or unsupported input"**
- Check SMILES syntax
- Try alternative format (name instead of SMILES)
- Ensure molecule exists in database

**"Could not resolve name/formula"**
- Molecule might not be in PubChem
- Try official IUPAC name
- Use SMILES format instead

**Bohr models not showing**
- CSV file might not be loaded
- Images might be loading from external CDN
- Check browser network tab for 404 errors

**Structure generation failed**
- RDKit might not recognize unusual valence
- Try simplified version of molecule
- Report issue with SMILES string

## Future Enhancements

- [ ] 3D molecular structure viewer (Jsmol)
- [ ] Reaction mechanism visualization
- [ ] ADME property predictions
- [ ] Virtual screening capabilities
- [ ] Molecular fingerprint comparison
- [ ] Batch processing
- [ ] Export to multiple formats
- [ ] Spectroscopy prediction
- [ ] Toxicity predictions
- [ ] Synthesis route suggestions

## References

1. **RDKit Documentation**: https://www.rdkit.org/
2. **PubChem REST API**: https://pubchem.ncbi.nlm.nih.gov/docs/PUG-REST
3. **SMILES Tutorial**: https://www.daylight.com/dayhtml/doc/theory/theory.smiles.html
4. **InChI Standard**: https://www.inchi-trust.org/
5. **Lipinski's Rule of Five**: Lipinski et al., Adv. Drug Deliv. Rev. 1997
6. **Periodic Table Data**: Google Periodic Table Project

## Citation

If you use this tool in research, please cite:

```
SMILES Converter Studio (2025)
Enhanced molecular property analysis tool
Based on RDKit, PubChem, and periodic table data
```

## License

This tool is part of the Retrosynthesis Planner project.
See LICENSE file in the project root for details.

---

**Version**: 1.0  
**Last Updated**: March 2025  
**Author**: AI Chemistry Assistant
