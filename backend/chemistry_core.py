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

logger = logging.getLogger(__name__)

PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
DATA_DIR = Path(__file__).parent / "data"
SDF_FILE = DATA_DIR / "chembl_sample.sdf"

# Global cache for SDF molecules
_sdf_molecules_cache = None
_sdf_names_cache = None

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