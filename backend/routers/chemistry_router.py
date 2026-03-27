from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from chemistry_core import (
    smiles_to_mol,
    mol_to_png_base64,
    get_basic_properties,
    mol_to_inchi,
    mol_to_inchikey,
    mol_to_molblock,
    mol_to_canonical_smiles,
    pubchem_search_compounds,
    search_local_dataset,
    get_enhanced_molecular_analysis,
    analyze_reactivity,
    get_bohr_models_for_molecule,
    load_smiles_dataset,
    search_smiles_dataset,
    get_dataset_statistics,
    get_dataset_sample,
)

router = APIRouter(prefix="/chemistry", tags=["chemistry"])


class SmilesInput(BaseModel):
    smiles: str


class SmilesResponse(BaseModel):
    valid: bool
    image_base64: str | None = None
    canonical_smiles: str | None = None
    properties: dict | None = None
    inchi: str | None = None
    inchikey: str | None = None
    molblock: str | None = None
    error: str | None = None


@router.post("/convert", response_model=SmilesResponse)
async def convert_smiles(input: SmilesInput):
    """
    Convert SMILES → structure image + properties + identifiers
    """
    mol, err = smiles_to_mol(input.smiles.strip())

    if mol is None:
        return SmilesResponse(
            valid=False,
            error=err or "Invalid or unsupported SMILES"
        )

    return SmilesResponse(
        valid=True,
        image_base64=mol_to_png_base64(mol),
        canonical_smiles=mol_to_canonical_smiles(mol),
        properties=get_basic_properties(mol),
        inchi=mol_to_inchi(mol),
        inchikey=mol_to_inchikey(mol),
        molblock=mol_to_molblock(mol),
    )


class EnhancedAnalysisResponse(BaseModel):
    valid: bool
    canonical_smiles: str | None = None
    inchi: str | None = None
    inchikey: str | None = None
    molblock: str | None = None
    image_base64: str | None = None
    properties: dict | None = None
    reactivity: dict | None = None
    element_bohr_models: dict | None = None
    molecular_formula: str | None = None
    error: str | None = None


@router.post("/analyze-enhanced", response_model=EnhancedAnalysisResponse)
async def analyze_enhanced(input: SmilesInput):
    """
    Enhanced molecular analysis: properties + reactivity + Bohr models + identifiers
    """
    result = get_enhanced_molecular_analysis(input.smiles.strip())
    return EnhancedAnalysisResponse(**result)


class SearchInput(BaseModel):
    query: str
    max_results: int = 10


class SearchResult(BaseModel):
    name: str
    smiles: str
    cid: int


@router.post("/search", response_model=list[SearchResult])
async def search_compounds(input: SearchInput):
    """
    Search for compounds by name or SMILES.
    Priority: Local dataset (ChEMBL) → PubChem.
    Returns list of {name, smiles, cid}.
    """
    # Try local dataset first (faster, no API calls)
    local_results = search_local_dataset(input.query, input.max_results)
    
    if local_results:
        return [SearchResult(**r) for r in local_results]
    
    # Fall back to PubChem if nothing found locally
    pubchem_results = pubchem_search_compounds(input.query, input.max_results)
    return [SearchResult(**r) for r in pubchem_results]


class DatasetSearchInput(BaseModel):
    query: str
    limit: int = 50


class DatasetMolecule(BaseModel):
    smiles: str
    pic50: float
    num_atoms: int
    logp: float
    index: int


@router.post("/dataset-search", response_model=list[DatasetMolecule])
async def dataset_search(input: DatasetSearchInput):
    """
    Search SMILES dataset by pIC50 value or SMILES content.
    Returns matching molecules from the big dataset.
    """
    results = search_smiles_dataset(input.query, input.limit)
    return [DatasetMolecule(**r) for r in results]


@router.get("/dataset-stats")
async def dataset_statistics():
    """
    Get statistics about the SMILES dataset.
    """
    stats = get_dataset_statistics()
    return {"status": "success", "statistics": stats}


@router.get("/dataset-sample")
async def dataset_sample(limit: int = 20):
    """
    Get a random sample of molecules from the dataset.
    """
    sample = get_dataset_sample(limit)
    return {"status": "success", "sample": sample}


@router.get("/dataset-info")
async def dataset_info():
    """
    Get info about the SMILES dataset.
    """
    df = load_smiles_dataset()
    if df is None:
        return {"status": "error", "message": "Dataset not found"}
    
    return {
        "status": "success",
        "dataset_loaded": True,
        "total_molecules": len(df),
        "columns": ["SMILES", "pIC50", "num_atoms", "logP"]
    }


@router.get("/health")
async def health_check():
    return {"status": "chemistry backend ok", "rdkit_version": "2025.x.x"}
