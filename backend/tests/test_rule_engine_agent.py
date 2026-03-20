from app.agents.rule_engine_agent import RuleEngineAgent
from app.models.schemas import AlertPayload


def test_rule_engine_hits_multiple_builtin_rules() -> None:
    payload = AlertPayload(
        alert_id="ALT-001",
        title="Ransomware activity detected",
        severity="critical",
        user="admin",
        asset="prod-db-01",
        description="Potential exfiltration detected",
    )
    agent = RuleEngineAgent()

    response = agent.analyze(payload)

    assert len(response.matched_rules) >= 4
    assert response.risk_score >= 85
    assert response.recommendation == "block_and_isolate"


def test_rule_engine_returns_monitor_for_low_risk() -> None:
    payload = AlertPayload(alert_id="ALT-002", title="Normal log", severity="low")
    agent = RuleEngineAgent()

    response = agent.analyze(payload)

    assert response.matched_rules == []
    assert response.recommendation == "monitor"
