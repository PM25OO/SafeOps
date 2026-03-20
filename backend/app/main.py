from fastapi import FastAPI

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.orchestration.workflow import AnalysisWorkflow

app = FastAPI(
    title="SafeOps AI Backend",
    description="Phase 1 backend service for browser-plugin driven alert analysis.",
    version="0.1.0",
)

workflow = AnalysisWorkflow()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    return workflow.analyze(request)
