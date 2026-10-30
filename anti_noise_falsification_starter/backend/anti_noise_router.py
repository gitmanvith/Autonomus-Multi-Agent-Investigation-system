from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from anti_noise_engine import evaluate

router = APIRouter(prefix="/api/noise-challenge", tags=["Noise Challenge"])


class Hypothesis(BaseModel):
    x: str
    y: str


class EvaluationRequest(BaseModel):
    discovery_data: Dict[str, List[float]]
    hypotheses: List[Hypothesis] = Field(min_length=1, max_length=100)
    replication_data: Optional[Dict[str, List[float]]] = None
    alpha: float = 0.05
    permutations: int = Field(default=999, ge=99, le=20000)
    seed: int = 17
    holdout_fraction: float = 0.3


@router.post("/evaluate")
def evaluate_route(request: EvaluationRequest):
    try:
        payload = request.model_dump()
        payload["hypotheses"] = [h.model_dump() for h in request.hypotheses]
        return evaluate(payload)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/health")
def health():
    return {"status": "ok", "service": "anti-noise-falsification"}
