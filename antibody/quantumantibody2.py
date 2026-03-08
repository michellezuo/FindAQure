# DOUBLE GROVER: Outer (best Ab) + Inner (best docking site per Ab)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import uvicorn

app = FastAPI(title="QuantumAntibody - DOUBLE GROVER Backend")

# [KEEP ALL YOUR DATA MODELS THE SAME - no change needed]

class AntigenInput(BaseModel):
    id: str
    sequence: str

class AntibodyInput(BaseModel):
    id: str
    sequence: str

class GroverResult(BaseModel):
    antigen_id: str
    iterations: int
    candidate_states: List[Dict[str, Any]]

# =============================================================================
# NEW: INNER GROVER - Docking Site Search (per antibody)
# =============================================================================
def score_docking_site(antigen_seq: str, ab_seq: str, site_idx: int) -> float:
    """FIXED: Real electrostatic + hydrophobic complementarity"""
    L = min(len(antigen_seq), len(ab_seq))
    if site_idx >= L:
        return 0.0
    
    ag = antigen_seq[site_idx].upper()
    ab = ab_seq[site_idx].upper()
    
    # CHARGE COMPLEMENTARITY (opposite charges attract!)
    ag_charge = {'K':+1, 'R':+1, 'D':-1, 'E':-1}.get(ag, 0)
    ab_charge = {'K':+1, 'R':+1, 'D':-1, 'E':-1}.get(ab, 0)
    
    charge_score = 1.0 if ag_charge * ab_charge < 0 else 0.3  # Opposite = good!
    
    # HYDROPHOBIC MATCH (like-with-like)
    hydrophobic = {'I':1, 'L':1, 'V':1, 'F':1, 'W':1, 'Y':1}
    hydro_score = 0.8 if hydrophobic.get(ag,0) and hydrophobic.get(ab,0) else 0.5
    
    # SEQUENCE SIMILARITY BONUS
    seq_bonus = 1.0 if ag == ab else 0.7
    
    score = 0.6 * charge_score + 0.3 * hydro_score + 0.1 * seq_bonus
    return max(0.0, min(1.0, score))

def grover_docking_sites(antigen: str, antibody: str, num_sites: int = 8) -> Dict:
    """INNER GROVER: Find best docking position for THIS antibody"""
    scores = np.array([score_docking_site(antigen, antibody, i) for i in range(num_sites)])
    threshold = np.percentile(scores, 75)  # Top 25% docking sites are "good"
    
    result = grover_search(scores, threshold, iterations=2)  # 2 iterations for inner
    return {
        'best_docking_prob': float(np.max(result['probabilities'])),
        'best_docking_site': int(np.argmax(result['probabilities'])),
        'docking_scores': scores.tolist()
    }

# =============================================================================
# YOUR ORIGINAL GROVER FUNCTIONS (UNCHANGED)
# =============================================================================
def init_uniform_state(n: int) -> np.ndarray:
    amp = 1.0 / np.sqrt(n)
    return np.full(n, amp)

def mark_good_candidates(scores: np.ndarray, threshold: float) -> np.ndarray:
    return (scores >= threshold).astype(float)

def apply_oracle(state: np.ndarray, is_marked: np.ndarray) -> np.ndarray:
    out = state.copy()
    out[is_marked == 1] *= -1.0
    return out

def apply_diffusion(state: np.ndarray) -> np.ndarray:
    mean = np.mean(state)
    return 2 * mean - state

def grover_search(scores: np.ndarray, threshold: float, iterations: int) -> Dict[str, np.ndarray]:
    n = len(scores)
    is_marked = mark_good_candidates(scores, threshold)
    state = init_uniform_state(n)
    
    for k in range(iterations):
        state = apply_oracle(state, is_marked)
        state = apply_diffusion(state)
    
    probs = np.abs(state)**2
    norm = np.sqrt(np.sum(probs))
    if norm > 0:
        state = state / norm
    
    return {'amplitudes': state, 'probabilities': np.abs(state)**2, 'is_marked': is_marked}

# =============================================================================
# UPGRADED: Outer Grover + Inner Docking Grover
# =============================================================================
def score_antibody(antigen: AntigenInput, antibody: AntibodyInput) -> float:
    """OUTER GROVER oracle: Score antibody = its BEST docking site quality"""
    docking = grover_docking_sites(antigen.sequence, antibody.sequence)
    return docking['best_docking_prob']  # Antibody score = best docking score

# =============================================================================
# MAIN ENDPOINT (same interface, DOUBLE QUANTUM inside!)
# =============================================================================
@app.post("/api/quantum_antibody_search", response_model=GroverResult)
async def quantum_antibody_search(
    antigen: AntigenInput,
    antibodies: List[AntibodyInput]
) -> GroverResult:
    N = len(antibodies)
    if N == 0:
        raise HTTPException(status_code=400, detail="No antibodies provided")
    
    print(f"🚀 DOUBLE GROVER: {N} antibodies x 8 docking sites each")
    
    # OUTER GROVER: Score each antibody (runs INNER GROVER automatically)
    scores = np.array([score_antibody(antigen, ab) for ab in antibodies])
    print(f"Outer scores: {scores}")
    
    # Outer threshold
    sorted_scores = np.sort(scores)[::-1]
    threshold = max(0.6, sorted_scores[min(len(sorted_scores)-1, int(N * 0.25))])
    
    # OUTER GROVER
    iterations = 3
    outer_result = grover_search(scores, threshold, iterations)
    
    # For top antibodies, compute FULL docking details
    top_antibody_ids = [antibodies[i].id for i in np.argsort(outer_result['probabilities'])[-3:]]
    
    candidate_states = []
    for i, ab in enumerate(antibodies):
        # Run inner grover for visualization (top 3 get full details)
        full_docking = grover_docking_sites(antigen.sequence, ab.sequence) if ab.id in top_antibody_ids else {}
        
        candidate_states.append({
            'id': ab.id,
            'sequence': ab.sequence[:10] + "..." if len(ab.sequence) > 10 else ab.sequence,
            'classical_score': float(scores[i]),
            'is_marked': bool(outer_result['is_marked'][i]),
            'quantum_prob': float(outer_result['probabilities'][i]),
            # NEW: Docking site details (for top antibodies)
            'best_docking_site': full_docking.get('best_docking_site', -1),
            'best_docking_prob': float(full_docking.get('best_docking_prob', 0.0))
        })
    
    candidate_states.sort(key=lambda x: x['quantum_prob'], reverse=True)
    
    result = GroverResult(
        antigen_id=antigen.id,
        iterations=iterations,
        candidate_states=candidate_states
    )
    
    print(f"🏆 Top Ab: {candidate_states[0]['id']} (prob: {candidate_states[0]['quantum_prob']:.3f})")
    return result

# [KEEP YOUR DEMO ENDPOINT AND ROOT ENDPOINT THE SAME]
@app.get("/api/demo_data")
async def get_demo_data():
    return {
        "antigen": {"id": "SARS-CoV2_Spike_Epitope", "sequence": "YCDTVSEHDSFV"},
        "antibodies": [{"id": f"Ab{i}", "sequence": f"PARCDR3_{chr(65+i)}KFD"} for i in range(8)]
    }

@app.get("/")
async def root():
    return {"message": "DOUBLE GROVER QuantumAntibody - HackTJ Ready!", "status": "alive"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
