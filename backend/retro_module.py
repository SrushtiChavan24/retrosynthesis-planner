import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'retro_star'))

from retro_star.api import RSPlanner

_planner = None

def _get_planner():
    global _planner
    if _planner is None:
        _planner = RSPlanner(
            gpu=-1,
            use_value_fn=True,
            iterations=100,
            expansion_topk=50
        )
    return _planner

def plan(smiles: str) -> dict:
    try:
        result = _get_planner().plan(smiles)
        if result is None:
            return {"success": False, "routes": [], "message": "No route found"}
        return {"success": True, "smiles": smiles, "routes": result}
    except Exception as e:
        return {"success": False, "routes": [], "message": str(e)}
