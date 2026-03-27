from rdkit import Chem
from rdkit.Chem import Draw, AllChem, Descriptors
from rdkit.Chem.Draw import rdMolDraw2D
import base64
import io
from rdkit.Chem import rdDepictor
import logging
import requests
from urllib.parse import quote_plus
import os
from pathlib import Path
import csv
import pandas as pd

logger = logging.getLogger(__name__)

PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
DATA_DIR = Path(__file__).parent / "data"
SDF_FILE = DATA_DIR / "chembl_sample.sdf"

# SMILES dataset path
SMILES_DATASET_PATH = Path(__file__).parent / "data" / "SMILES_Big_Data_Set.csv"

# Periodic table CSV path - try multiple locations
def get_periodic_table_csv_path():
    """Find the periodic table CSV in multiple possible locations."""
    possible_paths = [
        Path(__file__).parent.parent / "frontend" / "public" / "data" / "PeriodicTableCSV.csv",
        Path(__file__).parent / "data" / "PeriodicTableCSV.csv",
        Path("/app/frontend/public/data/PeriodicTableCSV.csv"),
        Path("frontend/public/data/PeriodicTableCSV.csv"),
    ]
    
    for path in possible_paths:
        if path.exists():
            logger.info(f"Found periodic table CSV at: {path}")
            return path
    
    logger.warning(f"Periodic table CSV not found in any of these locations: {possible_paths}")
    return possible_paths[0]  # Return first path anyway (might exist at runtime)

# Global cache for periodic table data
_periodic_table_cache = None

# Global cache for SDF molecules
_sdf_molecules_cache = None
_sdf_names_cache = None

# Global cache for SMILES dataset
_smiles_dataset_cache = None

def load_sdf_molecules():
    """Load molecules from the SDF file into memory (cached)."""
    global _sdf_molecules_cache, _sdf_names_cache
    
    if _sdf_molecules_cache is not None:
        return _sdf_molecules_cache, _sdf_names_cache
    
    if not SDF_FILE.exists():
        logger.warning(f"SDF file not found: {SDF_FILE}")
        return {}, {}
    
    molecules = {}  # {smiles: mol}
    names = {}      # {smiles: [names]}
    
    try:
        supplier = Chem.SDMolSupplier(str(SDF_FILE), removeHs=False, sanitize=True)
        count = 0
        
        for mol in supplier:
            if mol is None:
                continue
            
            try:
                smiles = Chem.MolToSmiles(mol)
                if smiles and smiles not in molecules:
                    molecules[smiles] = mol
                    
                    # Extract names from molecule properties
                    mol_names = []
                    if mol.HasProp("chembl_id"):
                        mol_names.append(mol.GetProp("chembl_id"))
                    if mol.HasProp("pref_name"):
                        mol_names.append(mol.GetProp("pref_name"))
                    if mol.HasProp("_Name"):
                        mol_names.append(mol.GetProp("_Name"))
                    
                    if not mol_names:
                        mol_names.append(f"Compound_{count}")
                    
                    names[smiles] = mol_names
                    count += 1
                    
                    if count % 100 == 0:
                        logger.info(f"Loaded {count} molecules from SDF")
            except Exception as e:
                logger.debug(f"Failed to process molecule: {e}")
                continue
        
        logger.info(f"Loaded {count} molecules from SDF file")
        _sdf_molecules_cache = molecules
        _sdf_names_cache = names
        return molecules, names
        
    except Exception as e:
        logger.exception(f"Failed to load SDF file: {e}")
        return {}, {}


def search_local_dataset(query: str, max_results: int = 10) -> list[dict]:
    """Search the local SDF dataset by name or SMILES."""
    molecules, names = load_sdf_molecules()
    
    if not molecules:
        return []
    
    query_lower = query.lower().strip()
    results = []
    
    # Try exact SMILES match first
    if query in molecules:
        mol = molecules[query]
        mol_names = names.get(query, ["Unknown"])
        results.append({
            "name": mol_names[0],
            "smiles": query,
            "cid": hash(query) % 1000000,
            "source": "local"
        })
    
    # Try name search
    for smiles, mol_names_list in names.items():
        if len(results) >= max_results:
            break
        
        for name in mol_names_list:
            if query_lower in name.lower():
                results.append({
                    "name": mol_names_list[0],
                    "smiles": smiles,
                    "cid": hash(smiles) % 1000000,
                    "source": "local"
                })
                break
    
    return results[:max_results]


def pubchem_resolve_smiles(query: str) -> tuple[str | None, str | None]:
    """Try to resolve a common name or formula into a SMILES string via PubChem."""
    if not query or not isinstance(query, str):
        return None, "Query must be a non-empty string"

    # Try local dataset first
    local_results = search_local_dataset(query, max_results=1)
    if local_results:
        return local_results[0]["smiles"], None

    for namespace in ("name", "formula"):
        try:
            url = f"{PUBCHEM_BASE}/compound/{namespace}/{quote_plus(query)}/property/IsomericSMILES/JSON"
            resp = requests.get(url, timeout=6)
            if resp.status_code != 200:
                continue

            data = resp.json()
            props = data.get("PropertyTable", {}).get("Properties")
            if not props:
                continue

            smiles = props[0].get("IsomericSMILES")
            if smiles:
                return smiles, None
        except Exception as e:
            logger.debug("PubChem lookup failed (%s): %s", namespace, e)
            continue

    return None, "Could not resolve name/formula to a SMILES string"


def pubchem_search_compounds(query: str, max_results: int = 10) -> list[dict]:
    """Search PubChem for compounds matching a query, return list of {name, smiles, cid}."""
    if not query:
        return []

    try:
        # Use PubChem's search API
        search_url = f"{PUBCHEM_BASE}/compound/name/{quote_plus(query)}/cids/JSON"
        resp = requests.get(search_url, timeout=6)
        if resp.status_code != 200:
            return []

        data = resp.json()
        cids = data.get("IdentifierList", {}).get("CID", [])[:max_results]

        results = []
        for cid in cids:
            try:
                prop_url = f"{PUBCHEM_BASE}/compound/cid/{cid}/property/IUPACName,IsomericSMILES/JSON"
                prop_resp = requests.get(prop_url, timeout=6)
                if prop_resp.status_code == 200:
                    prop_data = prop_resp.json()
                    props = prop_data.get("PropertyTable", {}).get("Properties", [])
                    if props:
                        name = props[0].get("IUPACName", f"Compound {cid}")
                        smiles = props[0].get("IsomericSMILES")
                        if smiles:
                            results.append({"name": name, "smiles": smiles, "cid": cid})
            except Exception as e:
                logger.debug("Failed to get properties for CID %s: %s", cid, e)
                continue

        return results
    except Exception as e:
        logger.exception("PubChem search failed: %s", e)
        return []


def smiles_to_mol(smiles: str, allow_lookup: bool = True) -> tuple[Chem.Mol | None, str | None]:
    """Returns (molecule or None, error message or None)"""
    if not smiles or not isinstance(smiles, str):
        return None, "Input must be a non-empty string"

    smiles = smiles.strip()

    try:
        # Parse without sanitization first → catch more cases
        mol = Chem.MolFromSmiles(smiles, sanitize=False)
        if mol is None:
            # Try InChI input (e.g. starts with "InChI=")
            if smiles.lower().startswith("inchi="):
                mol = Chem.MolFromInchi(smiles, sanitize=False)

        if mol is None and allow_lookup:
            # Try PubChem lookup for common names or formulas
            pub_smiles, err = pubchem_resolve_smiles(smiles)
            if pub_smiles:
                return smiles_to_mol(pub_smiles, allow_lookup=False)
            return None, err

        if mol is None:
            return None, "RDKit could not parse this input"

        # Now try to sanitize (fix common valence / kekule issues)
        try:
            Chem.SanitizeMol(mol)
        except Exception as e:
            logger.warning(f"Sanitization failed: {e}")
            # Still continue — many molecules are still usable even without full sanitization

        # Add hydrogens
        mol = Chem.AddHs(mol, addCoords=True)

        # Generate 2D coordinates (more robust method)
        if not rdDepictor.Compute2DCoords(mol, clearConfs=True):
            logger.warning("2D coordinate generation failed")

        return mol, None

    except Exception as e:
        logger.exception(f"Unexpected error parsing SMILES: {smiles}")
        return None, f"Parsing failed: {str(e)}"


def mol_to_png_base64(mol: Chem.Mol, width: int = 400, height: int = 300) -> str | None:
    """Mol → PNG base64 string (ready for <img src="data:image/png;base64,....">)"""
    if mol is None:
        return None

    drawer = rdMolDraw2D.MolDraw2DSVG(width, height)
    drawer.DrawMolecule(mol)
    drawer.FinishDrawing()
    svg = drawer.GetDrawingText()

    # Convert SVG → PNG in memory (simple way)
    img = Draw.MolToImage(mol, size=(width, height))
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def get_basic_properties(mol: Chem.Mol) -> dict | None:
    if mol is None:
        return None

    return {
        "formula": Chem.rdMolDescriptors.CalcMolFormula(mol),
        "exact_mass": Descriptors.ExactMolWt(mol),
        "molecular_weight": Descriptors.MolWt(mol),
        "logp": Descriptors.MolLogP(mol),
        "tpsa": Descriptors.TPSA(mol),
        "hbd": Descriptors.NumHDonors(mol),
        "hba": Descriptors.NumHAcceptors(mol),
        "rotatable_bonds": Descriptors.NumRotatableBonds(mol),
        "heavy_atom_count": mol.GetNumHeavyAtoms(),
        "ring_count": Chem.rdMolDescriptors.CalcNumRings(mol),
    }


def mol_to_canonical_smiles(mol: Chem.Mol) -> str | None:
    if mol is None:
        return None
    return Chem.MolToSmiles(mol, canonical=True)


def mol_to_inchi(mol: Chem.Mol) -> str | None:
    if mol is None:
        return None
    return Chem.MolToInchi(mol)


def mol_to_inchikey(mol: Chem.Mol) -> str | None:
    if mol is None:
        return None
    return Chem.MolToInchiKey(mol)


def mol_to_molblock(mol: Chem.Mol) -> str | None:
    if mol is None:
        return None
    return Chem.MolToMolBlock(mol)


def load_periodic_table() -> dict:
    """Load periodic table data from CSV into cache."""
    global _periodic_table_cache
    
    if _periodic_table_cache is not None:
        return _periodic_table_cache
    
    _periodic_table_cache = {}
    periodic_table_csv = get_periodic_table_csv_path()
    
    if not periodic_table_csv.exists():
        logger.warning(f"Periodic table CSV not found at: {periodic_table_csv}")
        return _periodic_table_cache
    
    try:
        with open(periodic_table_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                symbol = row.get('symbol', '').strip()
                if symbol:
                    _periodic_table_cache[symbol] = row
                    logger.debug(f"Loaded periodic table data for {symbol}")
        
        logger.info(f"Loaded periodic table data for {len(_periodic_table_cache)} elements")
    except Exception as e:
        logger.exception(f"Failed to load periodic table CSV: {e}")
    
    return _periodic_table_cache


def get_bohr_models_for_molecule(mol: Chem.Mol) -> dict:
    """Extract element composition and return Bohr model URLs for each element."""
    if mol is None:
        return {}
    
    periodic_table = load_periodic_table()
    element_bohr_models = {}
    
    # Count atoms by element
    atom_counts = {}
    for atom in mol.GetAtoms():
        symbol = atom.GetSymbol()
        atom_counts[symbol] = atom_counts.get(symbol, 0) + 1
    
    # Get Bohr model URLs from periodic table
    for symbol, count in atom_counts.items():
        if symbol in periodic_table:
            element_data = periodic_table[symbol]
            bohr_2d = element_data.get('bohr_model_image', '')
            bohr_3d = element_data.get('bohr_model_3d', '')
            
            element_bohr_models[symbol] = {
                "count": count,
                "name": element_data.get('name', symbol),
                "atomic_number": element_data.get('number', ''),
                "bohr_model_image_2d": bohr_2d,
                "bohr_model_3d": bohr_3d,
                "electron_configuration": element_data.get('electron_configuration', ''),
                "electronegativity": element_data.get('electronegativity_pauling', '')
            }
    
    return element_bohr_models


def analyze_reactivity(mol: Chem.Mol) -> dict:
    """Analyze molecular reactivity based on descriptors."""
    if mol is None:
        return {}
    
    # Get molecular properties
    logp = Descriptors.MolLogP(mol)
    hba = Descriptors.NumHAcceptors(mol)
    hbd = Descriptors.NumHDonors(mol)
    tpsa = Descriptors.TPSA(mol)
    rotatable_bonds = Descriptors.NumRotatableBonds(mol)
    
    # Analyze functional groups and reactivity
    reactivity_indicators = []
    
    # Check for reactive functional groups
    smarts_patterns = {
        "Aldehyde": "[CX3H1](=O)[#6]",
        "Ketone": "[#6][CX3](=O)[#6]",
        "Carboxylic Acid": "[CX3](=O)[OX2H1]",
        "Ester": "[#6][CX3](=O)[OX2H0]",
        "Alcohol": "[OD2H]",
        "Amine": "[NX3;H2,H1;!$(NC=O)]",
        "Phenol": "[OD2H][c]",
        "Amide": "[NX3][CX3](=[OX1])[#6]",
        "Nitro": "[NX3](=O)=O",
        "Thiol": "[SX2H]",
        "Sulfide": "[#16X2H0]",
        "Halogen": "[F,Cl,Br,I]"
    }
    
    for group_name, smarts_pattern in smarts_patterns.items():
        try:
            pattern = Chem.MolFromSmarts(smarts_pattern)
            if pattern and mol.HasSubstructMatch(pattern):
                reactivity_indicators.append(group_name)
        except Exception as e:
            logger.debug(f"Failed to check pattern {group_name}: {e}")
    
    # Determine reactivity level
    reactivity_score = len(reactivity_indicators)
    if reactivity_score == 0:
        reactivity_level = "Low (Inert)"
    elif reactivity_score <= 2:
        reactivity_level = "Moderate"
    elif reactivity_score <= 4:
        reactivity_level = "High"
    else:
        reactivity_level = "Very High (Highly Reactive)"
    
    # Lipinski's Rule of Five compliance
    lipinski_violations = []
    if Descriptors.MolWt(mol) > 500:
        lipinski_violations.append("Molecular weight > 500")
    if logp > 5:
        lipinski_violations.append("LogP > 5")
    if hbd > 5:
        lipinski_violations.append("H-Bond Donors > 5")
    if hba > 10:
        lipinski_violations.append("H-Bond Acceptors > 10")
    
    drug_likeness = "Pass" if len(lipinski_violations) == 0 else f"Fail ({len(lipinski_violations)} violations)"
    
    return {
        "reactivity_level": reactivity_level,
        "reactivity_score": reactivity_score,
        "functional_groups": reactivity_indicators,
        "polarity_tpsa": tpsa,
        "flexibility": "Low" if rotatable_bonds <= 5 else "Moderate" if rotatable_bonds <= 10 else "High",
        "rotatable_bonds": rotatable_bonds,
        "drug_likeness": drug_likeness,
        "lipinski_violations": lipinski_violations,
        "lipinski_pass": len(lipinski_violations) == 0
    }


def get_enhanced_molecular_analysis(smiles: str) -> dict:
    """Get comprehensive molecular analysis including Bohr models, properties, and reactivity."""
    mol, err = smiles_to_mol(smiles)
    
    if mol is None:
        return {
            "valid": False,
            "error": err or "Invalid SMILES"
        }
    
    properties = get_basic_properties(mol)
    reactivity = analyze_reactivity(mol)
    bohr_models = get_bohr_models_for_molecule(mol)
    
    return {
        "valid": True,
        "canonical_smiles": mol_to_canonical_smiles(mol),
        "inchi": mol_to_inchi(mol),
        "inchikey": mol_to_inchikey(mol),
        "molblock": mol_to_molblock(mol),
        "image_base64": mol_to_png_base64(mol),
        "properties": properties,
        "reactivity": reactivity,
        "element_bohr_models": bohr_models,
        "molecular_formula": properties.get("formula") if properties else None
    }

def load_smiles_dataset(limit: int | None = None) -> pd.DataFrame | None:
    """Load SMILES dataset from CSV file into pandas DataFrame."""
    global _smiles_dataset_cache
    
    if _smiles_dataset_cache is not None:
        return _smiles_dataset_cache
    
    if not SMILES_DATASET_PATH.exists():
        logger.warning(f"SMILES dataset not found at: {SMILES_DATASET_PATH}")
        return None
    
    try:
        # Load CSV, removing the 'mol' column (RDKit object)
        df = pd.read_csv(SMILES_DATASET_PATH, usecols=['SMILES', 'pIC50', 'num_atoms', 'logP'])
        
        # Limit results if specified
        if limit is not None:
            df = df.head(limit)
        
        logger.info(f"Loaded {len(df)} molecules from SMILES dataset")
        _smiles_dataset_cache = df
        return df
        
    except Exception as e:
        logger.exception(f"Failed to load SMILES dataset: {e}")
        return None


def search_smiles_dataset(query: str, limit: int = 50) -> list[dict]:
    """Search SMILES dataset by pIC50 value or SMILES string."""
    df = load_smiles_dataset()
    
    if df is None or df.empty:
        return []
    
    results = []
    query_lower = query.lower().strip()
    
    try:
        # Try as pIC50 value (float comparison with range)
        try:
            target_pic50 = float(query)
            # Find molecules within ±0.5 of the target pIC50
            mask = (df['pIC50'] >= target_pic50 - 0.5) & (df['pIC50'] <= target_pic50 + 0.5)
            matching_rows = df[mask].sort_values('pIC50', ascending=False).head(limit)
            
            for idx, row in matching_rows.iterrows():
                results.append({
                    "smiles": row['SMILES'],
                    "pic50": row['pIC50'],
                    "num_atoms": row['num_atoms'],
                    "logp": row['logP'],
                    "index": int(idx)
                })
        except (ValueError, TypeError):
            pass  # Not a float, try other searches
        
        # Search by SMILES substring
        if len(results) < limit:
            smiles_matches = df[df['SMILES'].str.contains(query_lower, na=False, case=False)]
            for idx, row in smiles_matches.head(limit - len(results)).iterrows():
                if {
                    "smiles": row['SMILES'],
                    "pic50": row['pIC50'],
                    "num_atoms": row['num_atoms'],
                    "logp": row['logP'],
                    "index": int(idx)
                } not in results:
                    results.append({
                        "smiles": row['SMILES'],
                        "pic50": row['pIC50'],
                        "num_atoms": row['num_atoms'],
                        "logp": row['logP'],
                        "index": int(idx)
                    })
        
        return results
        
    except Exception as e:
        logger.exception(f"Error searching SMILES dataset: {e}")
        return []


def get_dataset_statistics() -> dict:
    """Get statistics about the loaded SMILES dataset."""
    df = load_smiles_dataset()
    
    if df is None or df.empty:
        return {}
    
    try:
        return {
            "total_molecules": len(df),
            "pic50_min": float(df['pIC50'].min()),
            "pic50_max": float(df['pIC50'].max()),
            "pic50_mean": float(df['pIC50'].mean()),
            "pic50_std": float(df['pIC50'].std()),
            "num_atoms_min": int(df['num_atoms'].min()),
            "num_atoms_max": int(df['num_atoms'].max()),
            "logp_min": float(df['logP'].min()),
            "logp_max": float(df['logP'].max()), 
            "logp_mean": float(df['logP'].mean()),
        }
    except Exception as e:
        logger.exception(f"Error calculating dataset statistics: {e}")
        return {}


def get_dataset_sample(limit: int = 20) -> list[dict]:
    """Get a random sample of molecules from the dataset."""
    df = load_smiles_dataset()
    
    if df is None or df.empty:
        return []
    
    try:
        sample_df = df.sample(n=min(limit, len(df)))
        results = []
        
        for idx, row in sample_df.iterrows():
            results.append({
                "smiles": row['SMILES'],
                "pic50": row['pIC50'],
                "num_atoms": row['num_atoms'],
                "logp": row['logP'],
                "index": int(idx)
            })
        
        return results
    except Exception as e:
        logger.exception(f"Error getting dataset sample: {e}")
        return []