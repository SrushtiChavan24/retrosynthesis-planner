from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import retro_module
from chemistry_core import pubchem_resolve_smiles

router = APIRouter(prefix="/retrosynthesis", tags=["retrosynthesis"])

class PlanRequest(BaseModel):
    smiles: str

class RetrosynthesisPlanResponse(BaseModel):
    success: bool
    target: str
    smiles: str | None = None
    reaction_type: str | None = None
    reactants: str | None = None
    description: str | None = None
    pathway_diagram: str | None = None
    found: bool
    fallback: bool = False
    route_cost: float | None = None
    route_len: int | None = None
    message: str | None = None


def _format_plan_response(query: str, raw_result: dict | None) -> RetrosynthesisPlanResponse:
    if raw_result is None or not raw_result.get("succ", False):
        message = "No retrosynthesis route found."
        if isinstance(raw_result, dict) and raw_result.get("message"):
            message = str(raw_result["message"])

        return RetrosynthesisPlanResponse(
            success=False,
            target=query,
            smiles=query,
            found=False,
            fallback=True,
            description=message,
            pathway_diagram=raw_result.get("routes") if isinstance(raw_result, dict) else None,
            message=message,
        )

    route_text = raw_result.get("routes")
    if route_text is None:
        route_text = "Retrosynthesis route data is unavailable."

    return RetrosynthesisPlanResponse(
        success=True,
        target=query,
        smiles=query,
        reaction_type="Retrosynthesis planning result",
        reactants="Generated precursor molecules are shown in the pathway diagram.",
        description=f"A retrosynthesis route was found for {query}.",
        pathway_diagram=str(route_text),
        found=True,
        fallback=False,
        route_cost=raw_result.get("route_cost"),
        route_len=int(raw_result.get("route_len")) if raw_result.get("route_len") is not None else None,
        message=str(raw_result.get("message", "")) if isinstance(raw_result, dict) else None,
    )


# @router.post("/plan", response_model=RetrosynthesisPlanResponse)
# def plan_route(body: PlanRequest):
#     query = body.smiles.strip()
#     if not query:
#         raise HTTPException(status_code=400, detail="Target SMILES cannot be empty")

#     smiles, error = pubchem_resolve_smiles(query)
#     if smiles:
#         target = query
#         query = smiles
#     else:
#         target = query

#     raw_result = retro_module.plan(query)
#     response = _format_plan_response(target, raw_result)
#     response.smiles = query
#     return response

@router.post("/plan")
def plan_route(body: PlanRequest):
    if not body.smiles.strip():
        return {"success": False, "message": "SMILES string required"}
    return retro_module.plan(body.smiles.strip())


@router.post("/analyze", response_model=RetrosynthesisPlanResponse)
def analyze_route(body: PlanRequest):
    return plan_route(body)
