import sys, os

RETRO_REPO = os.path.join(os.path.dirname(__file__), 'retro_star')
RETRO_PKG  = os.path.join(RETRO_REPO, 'retro_star')
RETRO_MLP  = os.path.join(RETRO_PKG, 'packages', 'mlp_retrosyn')
RETRO_RDC  = os.path.join(RETRO_PKG, 'packages', 'rdchiral')

sys.path.insert(0, RETRO_REPO)
sys.path.insert(0, RETRO_PKG)
sys.path.insert(0, RETRO_MLP)
sys.path.insert(0, RETRO_RDC)

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


def parse_route_string(route_str: str) -> list:
    steps = []
    if not route_str or not isinstance(route_str, str):
        return steps
    for reaction in route_str.split('|'):
        parts = reaction.strip().split('>')
        if len(parts) == 3:
            try:
                prob = float(parts[1].strip())
            except ValueError:
                prob = 0.0
            steps.append({
                "product":     parts[0].strip(),
                "probability": round(prob, 4),
                "reactants":   [r.strip() for r in parts[2].split('.') if r.strip()]
            })
    return steps


def plan(smiles: str) -> dict:
    print("=== PLAN CALLED WITH:", smiles)
    try:
        result = _get_planner().plan(smiles)
        print("RAW RESULT:", result)

        if result is None:
            return {
                "success": False,
                "routes": [],
                "message": "No route found. Try a simpler molecule or increase iterations."
            }

        if result.get('route_len') == 0:
            return {
                "success":        True,
                "smiles":         smiles,
                "already_buyable": True,
                "routes":         [],
                "message":        "This molecule is already a purchasable starting material.",
                "time":           result.get('time', 0),
                "iter":           result.get('iter', 0),
                "route_cost":     0,
                "route_len":      0,
            }

        # ← THIS is the fix — parse result['routes'] string into steps
        parsed_steps = parse_route_string(result['routes'])

        return {
            "success":         True,
            "smiles":          smiles,
            "already_buyable": False,
            "routes":          parsed_steps,           # ← now a proper list
            "route_cost":      float(result.get('route_cost', 0)),
            "route_len":       result.get('route_len', 0),
            "time":            result.get('time', 0),
            "iter":            result.get('iter', 0),
        }

    except Exception as e:
        print("ERROR:", e)
        return {"success": False, "routes": [], "message": str(e)}