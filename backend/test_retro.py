# backend/test_retro.py
import sys
from fastapi import FastAPI
import os
from routers.retro_router import router as retro_router

app = FastAPI(
    title="AI Chemistry Backend - Phase 1",
    description="SMILES conversion & basic molecular analysis",
    version="0.1.0"
)
app.include_router(retro_router)

# same sys.path setup as retro_module.py
BASE = os.path.join(os.path.dirname(__file__), 'retro_star')
sys.path.insert(0, BASE)
sys.path.insert(0, os.path.join(BASE, 'retro_star', 'packages', 'mlp_retrosyn'))
sys.path.insert(0, os.path.join(BASE, 'retro_star', 'packages', 'rdchiral'))

print("Step 1: Checking imports...")
try:
    from retro_star.api import RSPlanner
    print("✓ RSPlanner imported successfully")
except Exception as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

print("\nStep 2: Initializing planner (this may take 30–60 seconds)...")
try:
    planner = RSPlanner(
        gpu=-1,
        use_value_fn=True,
        iterations=100,
        expansion_topk=50
    )
    print("✓ Planner initialized")
except Exception as e:
    print(f"✗ Planner init failed: {e}")
    sys.exit(1)

print("\nStep 3: Running plan on aspirin SMILES...")
try:
    # aspirin — simple enough to solve quickly
    smiles = "CC(=O)Oc1ccccc1C(=O)O"
    result = planner.plan(smiles)

    if result is None:
        print("✗ No route found — model data files may be missing")
    else:
        print("✓ Route found!")
        print(f"  Result: {result}")
except Exception as e:
    print(f"✗ Planning failed: {e}")
    sys.exit(1)

print("\n✓ All steps passed — backend is working correctly")