from pathlib import Path
import json
import logging
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.orchestration.workflow import AnalysisWorkflow, WorkflowExecutionError

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(
    title="SafeOps AI Backend",
    description="Phase 1 backend service for browser-plugin driven alert analysis.",
    version="0.1.0",
)

workflow = AnalysisWorkflow()

logger = logging.getLogger("safeops.backend")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


def _log_event(level: int, event: str, **fields: object) -> None:
    payload = {
        "event": event,
        "service": "safeops-backend",
        **fields,
    }
    logger.log(level, json.dumps(payload, ensure_ascii=False, default=str))


def _http_status_for_workflow_error(error: WorkflowExecutionError) -> int:
    if error.error_category == "state_error":
        return 500
    if error.retryable:
        return 502
    return 500


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
    start = time.perf_counter()
    try:
        response = workflow.analyze(request)
    except WorkflowExecutionError as exc:
        status_code = _http_status_for_workflow_error(exc)
        fields = {
            **exc.as_dict(),
            "status_code": status_code,
            "route": "/analyze",
            "event_type": request.event_type,
            "alert_id": request.payload.alert_id,
        }
        _log_event(logging.ERROR, "analyze_failed", **fields)
        raise HTTPException(status_code=status_code, detail=exc.as_dict()) from exc
    except Exception as exc:
        unknown_error = {
            "error_code": "INTERNAL_UNEXPECTED",
            "error_category": "unknown_internal_error",
            "stage": "api_handler",
            "message": "后端发生未分类异常",
            "retryable": False,
        }
        _log_event(
            logging.ERROR,
            "analyze_failed",
            **unknown_error,
            status_code=500,
            route="/analyze",
            event_type=request.event_type,
            alert_id=request.payload.alert_id,
            exception_type=type(exc).__name__,
        )
        raise HTTPException(status_code=500, detail=unknown_error) from exc

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    _log_event(
        logging.INFO,
        "analyze_succeeded",
        route="/analyze",
        event_type=request.event_type,
        alert_id=request.payload.alert_id,
        risk_score=response.risk_score,
        recommendation=response.recommendation,
        latency_ms=elapsed_ms,
    )
    return response
