# quantum_antibody_backend.py
# Complete FastAPI backend for Grover-style quantum antibody search
# For HackTJ - Invisible Infrastructure theme
# Run with: uvicorn quantum_antibody_backend:app --reload

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import uvicorn

app = FastAPI(title="QuantumAntibody - Grover Search Backend")

# =============================================================================
# DATA MODELS
# =============================================================================

class AntigenInput(BaseModel):
    id: str
    sequence: str  # e.g., "ACEKFD..." (short epitope)

class AntibodyInput(BaseModel):
    id: str
    sequence: str  # e.g., "PARCDR3..." (paratope/CDR region)

class GroverResult(BaseModel):
    antigen_id: str
    iterations: int
    candidate_states: List[Dict[str, Any]]

# =============================================================================
# PLACEHOLDER: Classical Scoring Function
# =============================================================================
# TODO: Replace this with your electrostatic/hydrophobicity matrix scoring
def score_antibody(antigen: AntigenInput, antibody: AntibodyInput) -> float:
    """
    TODO: IMPLEMENT YOUR PHYSICS-BASED SCORING HERE
    
    Current: Simple sequence matching score (REPLACE THIS)
    Future: Matrix-based electrostatic + hydrophobic complementarity
    
    Returns score in [0, 1] where 1 = perfect binding
    """
    a_seq = antigen.sequence.upper()
    b_seq = antibody.sequence.upper()
    
    L = min(len(a_seq), len(b_seq))
    if L == 0:
        return 0.0
    
    # Simple overlap score (REPLACE WITH YOUR MATRIX SCORING)
    matches = sum(1 for i in range(L) if a_seq[i] == b_seq[i])
    score = matches / L
    
    # Add some randomness to make it interesting for demo
    score += np.random.normal(0, 0.05)
    return max(0.0, min(1.0, score))

# =============================================================================
# GROVER'S ALGORITHM IMPLEMENTATION
# =============================================================================

def init_uniform_state(n: int) -> np.ndarray:
    """Initial equal superposition state: 1/sqrt(N) for all candidates"""
    amp = 1.0 / np.sqrt(n)
    return np.full(n, amp)

def mark_good_candidates(scores: np.ndarray, threshold: float) -> np.ndarray:
    """Oracle: 1 if good candidate (score >= threshold), else 0"""
    return (scores >= threshold).astype(float)

def apply_oracle(state: np.ndarray, is_marked: np.ndarray) -> np.ndarray:
    """Oracle operator: Flip phase (-1) for marked (good) states"""
    out = state.copy()
    out[is_marked == 1] *= -1.0
    return out

def apply_diffusion(state: np.ndarray) -> np.ndarray:
    """Diffusion operator: Reflect about mean amplitude"""
    n = len(state)
    mean = np.mean(state)
    return 2 * mean - state

def grover_search(
    scores: np.ndarray, 
    threshold: float, 
    iterations: int
) -> Dict[str, np.ndarray]:
    """Full Grover search simulation"""
    n = len(scores)
    is_marked = mark_good_candidates(scores, threshold)
    
    state = init_uniform_state(n)
    
    for k in range(iterations):
        state = apply_oracle(state, is_marked)
        state = apply_diffusion(state)
    
    # Normalize (in case of numerical drift)
    probs = np.abs(state)**2
    norm = np.sqrt(np.sum(probs))
    if norm > 0:
        state = state / norm
    
    return {
        'amplitudes': state,
        'probabilities': np.abs(state)**2,
        'is_marked': is_marked
    }

# =============================================================================
# MAIN BACKEND ENDPOINT
# =============================================================================

@app.post("/api/quantum_antibody_search", response_model=GroverResult)
async def quantum_antibody_search(
    antigen: AntigenInput,
    antibodies: List[AntibodyInput]
) -> GroverResult:
    """
    Main endpoint: Run Grover's algorithm to find best antibody candidates
    """
    N = len(antibodies)
    if N == 0:
        raise HTTPException(status_code=400, detail="No antibodies provided")
    
    if N > 64:  # Keep it small for demo
        raise HTTPException(status_code=400, detail="Max 64 antibodies")
    
    # ========================================
    # STEP 1: Classical scoring for oracle
    print(f"Scoring {N} antibodies against antigen {antigen.id}")
    scores = np.array([score_antibody(antigen, ab) for ab in antibodies])
    
    # ========================================
    # STEP 2: Set threshold (top ~25% are "good")
    sorted_scores = np.sort(scores)[::-1]
    top_cut = sorted_scores[min(len(sorted_scores)-1, int(N * 0.25))]
    threshold = max(0.6, top_cut)  # At least 0.6 or top quartile
    print(f"Oracle threshold: {threshold:.3f}")
    
    # ========================================
    # STEP 3: Run Grover (fixed 3 iterations for demo)
    iterations = 3
    grover_result = grover_search(scores, threshold, iterations)
    
    # ========================================
    # STEP 4: Build response
    candidate_states = []
    for i, ab in enumerate(antibodies):
        candidate_states.append({
            'id': ab.id,
            'sequence': ab.sequence[:10] + "..." if len(ab.sequence) > 10 else ab.sequence,
            'classical_score': float(scores[i]),
            'is_marked': bool(grover_result['is_marked'][i]),
            'amplitude': float(grover_result['amplitudes'][i]),
            'probability': float(grover_result['probabilities'][i])
        })
    
    # Sort by final quantum probability (highest first)
    candidate_states.sort(key=lambda x: x['probability'], reverse=True)
    
    result = GroverResult(
        antigen_id=antigen.id,
        iterations=iterations,
        candidate_states=candidate_states
    )
    
    print(f"Top candidate prob: {candidate_states[0]['probability']:.3f}")
    return result

# =============================================================================
# DEMO ENDPOINT (for frontend testing)
# =============================================================================

@app.get("/api/demo_data")
async def get_demo_data():
    """Returns sample antigen + antibodies for frontend testing"""
    return {
        "antigen": {
            "id": "SARS-CoV2_Spike_Epitope",
            "sequence": "YCDTVSEHDSFV"
        },
        "antibodies": [
            {"id": f"Ab{i}", "sequence": f"PARCDR3_{chr(65+i)}" + "KFD"} for i in range(8)
        ]
    }

# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/")
async def root():
    return {"message": "QuantumAntibody Backend - Ready for HackTJ!", "status": "alive"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)