from __future__ import annotations
from typing import Dict, List, Tuple
import numpy as np


def _pair(data: Dict[str, List[float]], x_name: str, y_name: str) -> Tuple[np.ndarray, np.ndarray]:
    if x_name not in data or y_name not in data:
        raise ValueError(f"Missing column(s): {x_name}, {y_name}")
    x, y = np.asarray(data[x_name], dtype=float), np.asarray(data[y_name], dtype=float)
    if x.ndim != 1 or y.ndim != 1 or len(x) != len(y):
        raise ValueError("All columns must be one-dimensional and have matching lengths")
    mask = np.isfinite(x) & np.isfinite(y)
    x, y = x[mask], y[mask]
    if len(x) < 10:
        raise ValueError(f"At least 10 paired finite observations are required for {x_name} vs {y_name}")
    if np.std(x) == 0 or np.std(y) == 0:
        raise ValueError(f"{x_name} or {y_name} has no variation")
    return x, y


def _r(x, y):
    value = float(np.corrcoef(x, y)[0, 1])
    return value if np.isfinite(value) else 0.0


def _perm_test(x, y, observed, permutations, seed):
    rng = np.random.default_rng(seed)
    extreme = sum(abs(_r(x, rng.permutation(y))) >= abs(observed) - 1e-12
                  for _ in range(permutations))
    return (extreme + 1) / (permutations + 1)


def _bh(p_values):
    p = np.asarray(p_values, dtype=float)
    m = len(p)
    order = np.argsort(p)
    ranked = p[order]
    adjusted_sorted = np.minimum.accumulate((ranked * m / np.arange(1, m + 1))[::-1])[::-1]
    adjusted = np.empty(m)
    adjusted[order] = np.clip(adjusted_sorted, 0, 1)
    return adjusted.tolist()


def _test(data, x_name, y_name, permutations, seed):
    x, y = _pair(data, x_name, y_name)
    corr = _r(x, y)
    return {"n": len(x), "correlation": corr,
            "permutation_p": _perm_test(x, y, corr, permutations, seed)}


def evaluate(payload):
    data = payload["discovery_data"]
    hypotheses = payload["hypotheses"]
    replication = payload.get("replication_data")
    alpha = float(payload.get("alpha", 0.05))
    permutations = int(payload.get("permutations", 999))
    seed = int(payload.get("seed", 17))
    fraction = float(payload.get("holdout_fraction", 0.3))

    if not 0.001 <= alpha <= 0.2: raise ValueError("alpha must be between 0.001 and 0.2")
    if not 99 <= permutations <= 20000: raise ValueError("permutations must be between 99 and 20000")
    if not 0.15 <= fraction <= 0.5: raise ValueError("holdout_fraction must be between 0.15 and 0.5")
    if not 1 <= len(hypotheses) <= 100: raise ValueError("Provide between 1 and 100 hypotheses")

    lengths = {len(v) for v in data.values()}
    if len(lengths) != 1: raise ValueError("Every discovery_data column must have the same number of rows")
    row_count = next(iter(lengths))
    if row_count < 20: raise ValueError("At least 20 rows are required for discovery and holdout testing")

    # One shared row split preserves the pairing between columns.
    rng = np.random.default_rng(seed)
    indices = rng.permutation(row_count)
    cut = int(row_count * (1 - fraction))
    train_idx, holdout_idx = indices[:cut], indices[cut:]
    train = {k: np.asarray(v, dtype=float)[train_idx].tolist() for k, v in data.items()}
    holdout_data = {k: np.asarray(v, dtype=float)[holdout_idx].tolist() for k, v in data.items()}

    stage1 = []
    for i, h in enumerate(hypotheses):
        stage1.append(_test(train, h["x"], h["y"], permutations, seed + i))
    adjusted = _bh([r["permutation_p"] for r in stage1])

    results = []
    for i, h in enumerate(hypotheses):
        first = stage1[i]
        m1 = adjusted[i] <= alpha

        try:
            second = _test(holdout_data, h["x"], h["y"], permutations, seed + 1000 + i)
            same2 = first["correlation"] * second["correlation"] > 0
            m2 = second["permutation_p"] <= alpha and same2
            second_status = "passed" if m2 else "failed"
        except ValueError as exc:
            second, same2, m2, second_status = {"error": str(exc)}, False, False, "failed"

        if replication is None:
            third, same3, m3, third_status = None, None, False, "not_run"
        else:
            try:
                third = _test(replication, h["x"], h["y"], permutations, seed + 2000 + i)
                same3 = first["correlation"] * third["correlation"] > 0
                m3 = third["permutation_p"] <= alpha and same3
                third_status = "passed" if m3 else "failed"
            except ValueError as exc:
                third, same3, m3, third_status = {"error": str(exc)}, False, False, "failed"

        verdict = ("validated" if m1 and m2 and m3 else
                   "needs_independent_replication" if m1 and m2 and third_status == "not_run" else
                   "rejected_or_not_supported")
        results.append({
            "hypothesis": h,
            "moment_1": {"name": "Permutation test + Benjamini-Hochberg correction",
                         "raw_p_value": first["permutation_p"],
                         "adjusted_p_value_bh": adjusted[i], "passed": bool(m1),
                         "status": "passed" if m1 else "failed"},
            "moment_2": {"name": "Untouched holdout validation", "result": second,
                         "same_effect_direction": bool(same2), "passed": bool(m2),
                         "status": second_status},
            "moment_3": {"name": "Independent replication", "result": third,
                         "same_effect_direction": same3, "passed": bool(m3),
                         "status": third_status},
            "verdict": verdict
        })

    return {
        "summary": {
            "hypotheses_tested": len(results),
            "validated": sum(r["verdict"] == "validated" for r in results),
            "needs_independent_replication": sum(r["verdict"] == "needs_independent_replication" for r in results),
            "rejected_or_not_supported": sum(r["verdict"] == "rejected_or_not_supported" for r in results),
            "alpha": alpha, "permutations": permutations
        },
        "results": results,
        "important_note": "A finding is validated only if all three stages pass. Missing independent replication is not a pass. Correlation does not establish causation."
    }
