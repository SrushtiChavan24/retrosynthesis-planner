from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from chemistry_core import (
    smiles_to_mol,
    mol_to_png_base64,
    get_basic_properties,
    mol_to_inchi,
    mol_to_inchikey,
    mol_to_molblock,
    pubchem_search_compounds,
    search_local_dataset,
)

router = APIRouter(prefix="/chemistry", tags=["chemistry"])


class SmilesInput(BaseModel):
    smiles: str


class SmilesResponse(BaseModel):
    valid: bool
    image_base64: str | None = None
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
   

    # In convert_smiles endpoint
    mol, err = smiles_to_mol(input.smiles.strip())

    if mol is None:
        return SmilesResponse(
        valid=False,
        error=err or "Invalid or unsupported SMILES"
        )

    return SmilesResponse(
        valid=True,
        image_base64=mol_to_png_base64(mol),
        properties=get_basic_properties(mol),
        inchi=mol_to_inchi(mol),
        inchikey=mol_to_inchikey(mol),
        molblock=mol_to_molblock(mol),
    )


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


@router.get("/health")
async def health_check():
    return {"status": "chemistry backend ok", "rdkit_version": "2025.x.x"}
