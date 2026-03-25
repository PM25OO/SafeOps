from fastapi.testclient import TestClient

from app.main import app
from app.orchestration.workflow import WorkflowExecutionError


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_llm_endpoint() -> None:
    response = client.get("/health/llm")
    assert response.status_code == 200
    body = response.json()
    assert "llm_connected" in body
    assert body["mode"] in {"mock", "qwen"}


def test_audit_recent_endpoint() -> None:
    response = client.get("/audit/recent?limit=5")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["items"], list)


def test_analyze_endpoint() -> None:
    payload = {
        "event_type": "alert",
        "payload": {
            "alert_id": "ALT-100",
            "title": "Bruteforce attempt",
            "severity": "high",
            "source_ip": "8.8.8.8",
            "asset": "prod-api-01",
            "user": "root",
            "description": "Bruteforce pattern observed",
        },
    }
    response = client.post("/analyze", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["risk_score"] >= 60
    assert body["recommendation"] in {"manual_review", "block_and_isolate"}
    assert isinstance(body["suggested_actions"], list)
    assert len(body["suggested_actions"]) >= 1
    assert body["ai_decision"] is not None
    assert body["policy_decision"] is not None
    assert body["audit_id"].startswith("AUD-")


def test_analyze_endpoint_returns_classified_error(monkeypatch) -> None:
    payload = {
        "event_type": "alert",
        "payload": {
            "alert_id": "ALT-ERR-1",
            "title": "Downstream service timeout",
            "severity": "high",
            "source_ip": "10.0.0.1",
            "asset": "prod-api-01",
            "user": "admin",
            "description": "Synthetic test payload",
        },
    }

    def _raise_workflow_error(_request):
        raise WorkflowExecutionError(
            error_code="LLM_ENHANCE_FAILURE",
            error_category="agent_execution_error",
            stage="ai_enhance",
            message="LLMBridgeAgent 执行失败",
            retryable=True,
        )

    monkeypatch.setattr("app.main.workflow.analyze", _raise_workflow_error)
    response = client.post("/analyze", json=payload)

    assert response.status_code == 502
    body = response.json()
    assert body["detail"]["error_code"] == "LLM_ENHANCE_FAILURE"
    assert body["detail"]["error_category"] == "agent_execution_error"
    assert body["detail"]["stage"] == "ai_enhance"
    assert body["detail"]["retryable"] is True


def test_analyze_endpoint_returns_unknown_internal_error(monkeypatch) -> None:
    payload = {
        "event_type": "alert",
        "payload": {
            "alert_id": "ALT-ERR-2",
            "title": "Unexpected failure",
            "severity": "medium",
            "source_ip": "10.0.0.2",
            "asset": "prod-api-02",
            "user": "analyst",
            "description": "Synthetic test payload",
        },
    }

    def _raise_unknown_error(_request):
        raise ValueError("unexpected")

    monkeypatch.setattr("app.main.workflow.analyze", _raise_unknown_error)
    response = client.post("/analyze", json=payload)

    assert response.status_code == 500
    body = response.json()
    assert body["detail"]["error_code"] == "INTERNAL_UNEXPECTED"
    assert body["detail"]["error_category"] == "unknown_internal_error"
    assert body["detail"]["stage"] == "api_handler"
    assert body["detail"]["retryable"] is False
