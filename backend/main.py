from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chemistry_router
from routers.retro_router import router as retrosynthesis_router


app = FastAPI(
    title="AI Chemistry Backend - Phase 1",
    description="SMILES conversion & basic molecular analysis",
    version="0.1.0"
)

# Allow frontend (Next.js) to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chemistry_router.router)
# app.include_router(electrolysis_router.router)
app.include_router(retrosynthesis_router)

@app.get("/")
async def root():
    return {
        "message": "Chemistry Backend Phase 1",
        "docs": "/docs",
        "try": "POST /chemistry/convert with {'smiles': 'CCO'}"
    }
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)   
    
