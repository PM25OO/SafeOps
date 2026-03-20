from app.agents.audit_policy_agent import AuditPolicyAgent
from app.models.schemas import AlertPayload, AnalyzeResponse


def test_policy_requires_human_for_high_risk() -> None:
    agent = AuditPolicyAgent()
    payload = AlertPayload(alert_id="ALT-HIGH", severity="critical", asset="prod-core")
    response = AnalyzeResponse(matched_rules=[], risk_score=90, recommendation="block_and_isolate")

    decision = agent.evaluate(payload, response)

    assert decision.policy_id == "P001"
    assert decision.allow_execute is False
    assert decision.requires_human_confirm is True


def test_policy_allows_low_risk_non_prod() -> None:
    agent = AuditPolicyAgent()
    payload = AlertPayload(alert_id="ALT-LOW", severity="low", asset="dev-sandbox")
    response = AnalyzeResponse(matched_rules=[], risk_score=30, recommendation="monitor")

    decision = agent.evaluate(payload, response)

    assert decision.policy_id == "P003"
    assert decision.allow_execute is True
    assert decision.requires_human_confirm is False