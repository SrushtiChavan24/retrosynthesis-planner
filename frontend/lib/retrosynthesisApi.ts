// frontend/lib/retrosynthesisApi.ts

const BACKEND_URL = 'http://localhost:8000'

export interface RouteNode {
  mol: string
  children: RouteNode[]
}

export interface SynthesisRoute {
  cost: number
  route: RouteNode[]
}

export interface PlanResult {
  success: boolean
  smiles: string
  routes: SynthesisRoute[]
  message?: string
}

export async function planRetrosynthesis(smiles: string): Promise<PlanResult> {
  const response = await fetch(`${BACKEND_URL}/retrosynthesis/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smiles })
  })

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`)
  }

  return response.json()
}