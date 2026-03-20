from __future__ import annotations

from app.models.schemas import AlertPayload, AnalyzeResponse, PolicyDecision


class AuditPolicyAgent:
    """Basic policy gate for Phase 1 MVP."""

    def evaluate(self, payload: AlertPayload, response: AnalyzeResponse) -> PolicyDecision:
        if response.risk_score >= 85:
            return PolicyDecision(
                policy_id="P001",
                allow_execute=False,
                requires_human_confirm=True,
                reason="High-risk action requires mandatory human confirmation.",
            )

        asset = (payload.asset or "").lower()
        if "prod" in asset and response.risk_score >= 60:
            return PolicyDecision(
                policy_id="P002",
                allow_execute=False,
                requires_human_confirm=True,
                reason="Production asset operation must be manually approved.",
            )

        return PolicyDecision(
            policy_id="P003",
            allow_execute=True,
            requires_human_confirm=False,
            reason="Low to medium risk with non-production scope.",
        )