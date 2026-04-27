from fastapi import APIRouter
from pydantic import BaseModel
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import retro_module

router = APIRouter(prefix="/retrosynthesis", tags=["retrosynthesis"])

class PlanRequest(BaseModel):
    smiles: str

@router.post("/plan")
def plan_route(body: PlanRequest):
    return retro_module.plan(body.smiles.strip())
