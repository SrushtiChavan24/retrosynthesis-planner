from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import os

router = APIRouter(prefix="/retrosynthesis", tags=["retrosynthesis"])

# Path to the retrosynthesis dataset
DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(DATA_DIR, "../../retrosynthesis-planner/dataset/reactions.csv")

class RetrosynthesisInput(BaseModel):
    smiles: str

class RetrosynthesisResult(BaseModel):
    target: str
    reaction_type: str | None = None
    reactants: str | None = None
    description: str | None = None
    found: bool = False

@router.post("/analyze", response_model=RetrosynthesisResult)
async def analyze_retrosynthesis(input: RetrosynthesisInput):
    """
    Analyze retrosynthesis for a target molecule SMILES.
    Returns possible reaction pathways backward to starting materials.
    """
    try:
        if not os.path.exists(DATASET_PATH):
            raise HTTPException(status_code=500, detail="Retrosynthesis dataset not found")

        data = pd.read_csv(DATASET_PATH)

        # Look for exact match in product_smiles
        match = data[data["product_smiles"] == input.smiles.strip()]

        if not match.empty:
            row = match.iloc[0]
            return RetrosynthesisResult(
                target=input.smiles.strip(),
                reaction_type=row["reaction_type"],
                reactants=row["reactant_smiles"],
                description=row["description"],
                found=True
            )
        else:
            return RetrosynthesisResult(
                target=input.smiles.strip(),
                found=False
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrosynthesis analysis failed: {str(e)}")

@router.get("/health")
async def retrosynthesis_health_check():
    return {"status": "retrosynthesis backend ok", "dataset_available": os.path.exists(DATASET_PATH)}