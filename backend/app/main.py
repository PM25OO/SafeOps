from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.orchestration.workflow import AnalysisWorkflow

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(
    title="SafeOps AI Backend",
    description="Phase 1 backend service for browser-plugin driven alert analysis.",
    version="0.1.0",
)

workflow = AnalysisWorkflow()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/llm")
def health_llm() -> dict[str, object]:
    return workflow.llm_health()


@app.get("/audit/recent")
def audit_recent(limit: int = 20) -> dict[str, object]:
    bounded_limit = max(1, min(limit, 100))
    return {"items": workflow.recent_audits(limit=bounded_limit)}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    return workflow.analyze(request)
