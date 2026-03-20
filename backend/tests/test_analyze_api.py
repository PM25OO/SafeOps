from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


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
