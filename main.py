"""Autonomous Multi-Agent Investigation System — FastAPI entry point.

Run the backend:
    cd "c:/Users/manvi/Desktop/autonomus multiagent investigation system"
    .venv/Scripts/activate
    uvicorn main:app --reload --port 8000

Or run directly:
    .venv/Scripts/python.exe main.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from fastapi import UploadFile, File, Form
import uuid

from pipeline import run_research_pipeline
from file_service import (
    validate_upload,
    save_uploaded_files,
    cleanup_session,
    UPLOAD_DIR,
    detect_language as detect_lang_from_ext,
)
from debug_pipeline import debug_file, debug_multiple_files
from language_detector import get_language_info, detect_language_from_content

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Autonomous Multi-Agent Investigation System",
    description="REST API for autonomous research and investigation using LangGraph agents.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allows the React/Vite frontend (default http://localhost:5173) to call this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # tighten this in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=1, description="Research topic to investigate")


class ResearchResponse(BaseModel):
    success: bool
    topic: str
    search_results: str | None = None
    scraped_content: str | None = None
    report: str | None = None
    feedback: str | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["System"])
async def root() -> Dict[str, Any]:
    """Root metadata endpoint."""
    return {
        "status": "online",
        "service": "Autonomous Multi-Agent Investigation System",
        "version": "1.0.0",
        "agents_available": 24,
        "funnel_capacity": "100 Funnels (500 MB)",
        "challenge_mitigation": "Active (MDL Noise Gating + FDR Q < 0.01)",
    }


@app.get("/health", tags=["System"])
async def health() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "autonomous-investigation-api"}


@app.post("/research", response_model=ResearchResponse, tags=["Research"])
async def run_research(request: ResearchRequest) -> ResearchResponse:
    """Run the full multi-agent research pipeline on a given topic.

    Pipeline steps:
    1. Explorer / Search agent — finds recent reliable information
    2. Reader agent — scrapes the most relevant URL for deeper content
    3. Writer chain — drafts a structured research report
    4. Critic chain — reviews and scores the report
    """
    try:
        import asyncio
        state: Dict[str, Any] = await asyncio.to_thread(run_research_pipeline, request.topic)

        return ResearchResponse(
            success=True,
            topic=request.topic,
            search_results=state.get("search_results"),
            scraped_content=state.get("scraped_content"),
            report=state.get("report"),
            feedback=state.get("feedback"),
            error=None,
        )
    except Exception as exc:  # noqa: BLE001 — surface any pipeline failure as a clean API error
        raise HTTPException(status_code=500, detail=f"Research pipeline failed: {exc}")


@app.get("/research/{topic}", response_model=ResearchResponse, tags=["Research"])
async def run_research_get(topic: str) -> ResearchResponse:
    """GET convenience wrapper that delegates to the POST research endpoint."""
    return await run_research(ResearchRequest(topic=topic))


# ---------------------------------------------------------------------------
# Debug — Request / Response Models
# ---------------------------------------------------------------------------
class DebugFileRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    filename: str = Field(..., description="Name of the file to debug")
    language: Optional[str] = Field(None, description="Programming language (auto-detected if omitted)")
    run_code: bool = Field(True, description="Attempt to compile/run the code to capture runtime errors")


class DebugFileResponse(BaseModel):
    session_id: str
    filename: str
    language: str
    language_info: dict
    timestamp: str
    runtime_errors: str
    compilation_errors: str
    stage_results: Dict[str, Any]
    final_report: str
    all_outputs: Dict[str, Any]


class DebugSessionResponse(BaseModel):
    session_id: str
    total_files: int
    languages_detected: List[str]
    file_results: List[Dict[str, Any]]
    cross_file_analysis: str
    executive_summary: str
    timestamp: str


class SupportedLanguagesResponse(BaseModel):
    languages: Dict[str, dict]


# ---------------------------------------------------------------------------
# Debug — Endpoints
# ---------------------------------------------------------------------------
@app.post("/debug/upload", tags=["Debug"])
async def upload_files(
    files: List[UploadFile] = File(..., description="Up to 10 files, max 500 MB total"),
    session_id: Optional[str] = Form(None, description="Session ID (auto-generated if omitted)"),
) -> Dict[str, Any]:
    """
    Upload up to 10 documents (max 500 MB total) for debugging.
    Files are validated and saved to disk under a session folder.
    """
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        validate_upload(files)
        saved_files = await save_uploaded_files(files, session_id)

        return {
            "success": True,
            "session_id": session_id,
            "files": saved_files,
            "max_files": 10,
            "max_total_size_mb": 500,
            "message": f"Uploaded {len(saved_files)} file(s) successfully",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")


@app.post("/debug/file", response_model=DebugFileResponse, tags=["Debug"])
async def debug_single_file(request: DebugFileRequest) -> DebugFileResponse:
    """
    Debug a single file that has already been uploaded.
    The file must exist in the session's upload folder.
    """
    file_path = str(UPLOAD_DIR / request.session_id / request.filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File '{request.filename}' not found in session '{request.session_id}'. Upload it first.",
        )

    try:
        result = await debug_file(
            file_path=file_path,
            filename=request.filename,
            session_id=request.session_id,
            language=request.language,
            run_code=request.run_code,
        )

        return DebugFileResponse(
            session_id=result["session_id"],
            filename=result["filename"],
            language=result["language"],
            language_info=result["language_info"],
            timestamp=result["timestamp"],
            runtime_errors=result["runtime_errors"],
            compilation_errors=result["compilation_errors"],
            stage_results=result["stage_results"],
            final_report=result["final_report"],
            all_outputs=result["all_outputs"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Debug failed: {exc}")


@app.post("/debug/session", response_model=DebugSessionResponse, tags=["Debug"])
async def debug_session(
    session_id: str = Form(..., description="Session ID from /debug/upload"),
    run_code: bool = Form(True, description="Attempt to compile/run each file"),
) -> DebugSessionResponse:
    """
    Debug all files in an upload session. Runs the full multi-agent pipeline
    on each file, then performs cross-file relationship analysis.
    """
    session_dir = UPLOAD_DIR / session_id
    if not session_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. Upload files first.",
        )

    files = []
    for f in sorted(session_dir.iterdir()):
        if f.is_file():
            files.append({
                "path": str(f),
                "original_name": f.name.split("_", 1)[1] if "_" in f.name else f.name,
                "language": detect_lang_from_ext(f.name),
            })

    if not files:
        raise HTTPException(
            status_code=400,
            detail=f"No files found in session '{session_id}'.",
        )

    try:
        result = await debug_multiple_files(
            files=files,
            session_id=session_id,
            run_code=run_code,
        )

        return DebugSessionResponse(
            session_id=result["session_id"],
            total_files=result["total_files"],
            languages_detected=result["languages_detected"],
            file_results=result["file_results"],
            cross_file_analysis=result["cross_file_analysis"],
            executive_summary=result["executive_summary"],
            timestamp=result["timestamp"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Session debug failed: {exc}")


@app.get("/debug/languages", response_model=SupportedLanguagesResponse, tags=["Debug"])
async def get_supported_languages() -> SupportedLanguagesResponse:
    """Return the list of supported programming languages for debugging."""
    from language_detector import LANGUAGE_SIGNATURES
    return SupportedLanguagesResponse(
        languages={lang: get_language_info(lang) for lang in LANGUAGE_SIGNATURES.keys()}
    )


@app.delete("/debug/session/{session_id}", tags=["Debug"])
async def cleanup_debug_session(session_id: str) -> Dict[str, str]:
    """Clean up all files for a debug session."""
    cleanup_session(session_id)
    return {"status": "cleaned", "session_id": session_id}


# ---------------------------------------------------------------------------
# 3D Agentic Network — Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/network/agents", tags=["Agentic Network"])
async def get_agentic_network() -> Dict[str, Any]:
    """
    Returns 3D spatial layout, connections, and real-time telemetry for all 24 agents.
    """
    from network_service import compute_3d_network_topology
    return compute_3d_network_topology()


# ---------------------------------------------------------------------------
# 100-Funnel Analysis & 500 MB Pipeline — Endpoints
# ---------------------------------------------------------------------------
class FunnelBatchRequest(BaseModel):
    total_funnels: int = Field(100, ge=10, le=500, description="Minimum 100 funnels")
    dataset_name: Optional[str] = Field("Enterprise Telemetry & PDF Ingestion Batch")
    approx_mb_consumed: Optional[float] = Field(482.6, description="Approximate MB consumed up to 500 MB")


@app.post("/api/funnels/batch", tags=["Funnels"])
async def run_funnels_batch(request: FunnelBatchRequest) -> Dict[str, Any]:
    """
    Executes and tracks minimum 100 investigation funnels concurrently.
    Demonstrates stage throughput, dropoff, and 500 MB data handling.
    """
    from funnel_service import generate_100_funnels_batch
    return generate_100_funnels_batch(
        total_funnels=request.total_funnels,
        dataset_name=request.dataset_name or "Enterprise Ingestion Batch",
        approx_mb_consumed=request.approx_mb_consumed or 482.6,
    )


@app.get("/api/funnels/batch", tags=["Funnels"])
async def get_funnels_batch() -> Dict[str, Any]:
    """GET convenience endpoint returning 100 active investigation funnels."""
    from funnel_service import generate_100_funnels_batch
    return generate_100_funnels_batch(total_funnels=100)


# ---------------------------------------------------------------------------
# Challenge Solver: Curiosity Noise Trap & 100 Hypotheses FDR — Endpoints
# ---------------------------------------------------------------------------
class ChallengeSimRequest(BaseModel):
    num_hypotheses: int = Field(100, ge=20, le=500)
    alpha_naive: float = Field(0.05, ge=0.001, le=0.2)
    fdr_q: float = Field(0.01, ge=0.0001, le=0.1)
    noise_variance: float = Field(0.85, ge=0.1, le=2.0)


@app.post("/api/challenge/simulate", tags=["Challenge Solver"])
async def simulate_challenge(request: ChallengeSimRequest) -> Dict[str, Any]:
    """
    Simulates the dual challenge:
    1. A curious agent gets stuck staring at pure noise (Noisy TV) vs our MDL Boredom filter.
    2. An agent that tests 100 hypotheses finds 5 significant ones by chance vs Benjamini-Hochberg FDR + Challenger Agent.
    """
    from challenge_service import run_noisy_tv_simulation, run_100_hypotheses_fdr_simulation

    noisy_tv_res = run_noisy_tv_simulation(steps=20, noise_variance=request.noise_variance)
    fdr_res = run_100_hypotheses_fdr_simulation(
        num_hypotheses=request.num_hypotheses,
        alpha_naive=request.alpha_naive,
        fdr_q=request.fdr_q,
    )

    return {
        "status": "success",
        "noisy_tv_challenge": noisy_tv_res,
        "fdr_hypotheses_challenge": fdr_res,
    }


@app.get("/api/challenge/simulate", tags=["Challenge Solver"])
async def simulate_challenge_get() -> Dict[str, Any]:
    """GET convenience wrapper for challenge solver simulation."""
    from challenge_service import run_noisy_tv_simulation, run_100_hypotheses_fdr_simulation
    return {
        "status": "success",
        "noisy_tv_challenge": run_noisy_tv_simulation(steps=20),
        "fdr_hypotheses_challenge": run_100_hypotheses_fdr_simulation(num_hypotheses=100),
    }


# ---------------------------------------------------------------------------
# PDF Document Processing & Report File Export — Endpoints
# ---------------------------------------------------------------------------
class ReportExportRequest(BaseModel):
    investigation: Dict[str, Any]


@app.post("/api/reports/export", tags=["Reports"])
async def export_report(request: ReportExportRequest) -> Dict[str, Any]:
    """
    Generates and saves the formatted investigation report to disk.
    """
    from pdf_report_service import export_report_to_file
    return export_report_to_file(request.investigation)



# ---------------------------------------------------------------------------
# Entry point for `python main.py`
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )