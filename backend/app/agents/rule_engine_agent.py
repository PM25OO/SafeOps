from __future__ import annotations

from app.models.schemas import AlertPayload, AnalyzeResponse, RuleMatch


class RuleEngineAgent:
    """Rule-based first-stage analyzer (Phase 1)."""

    def analyze(self, payload: AlertPayload) -> AnalyzeResponse:
        matches: list[RuleMatch] = []

        if payload.severity == "critical":
            matches.append(
                RuleMatch(
                    rule_id="R001",
                    rule_name="CriticalSeverity",
                    score=90,
                    reason="Alert severity is critical.",
                )
            )

        if payload.severity == "high":
            matches.append(
                RuleMatch(
                    rule_id="R002",
                    rule_name="HighSeverity",
                    score=70,
                    reason="Alert severity is high.",
                )
            )

        if payload.user and payload.user.lower() in {"admin", "root", "administrator"}:
            matches.append(
                RuleMatch(
                    rule_id="R003",
                    rule_name="PrivilegedAccount",
                    score=65,
                    reason="Privileged account was involved.",
                )
            )

        if payload.asset and "prod" in payload.asset.lower():
            matches.append(
                RuleMatch(
                    rule_id="R004",
                    rule_name="ProductionAsset",
                    score=60,
                    reason="Alert targets production asset.",
                )
            )

        text = f"{payload.title} {payload.description or ''}".lower()
        risky_keywords = ("ransomware", "bruteforce", "exfiltration", "malware", "c2")
        if any(keyword in text for keyword in risky_keywords):
            matches.append(
                RuleMatch(
                    rule_id="R005",
                    rule_name="HighRiskKeyword",
                    score=75,
                    reason="Alert text contains high-risk attack keywords.",
                )
            )

        risk_score = min(100, max((match.score for match in matches), default=20) + len(matches) * 3)

        if risk_score >= 85:
            recommendation = "block_and_isolate"
        elif risk_score >= 60:
            recommendation = "manual_review"
        else:
            recommendation = "monitor"

        return AnalyzeResponse(
            matched_rules=sorted(matches, key=lambda item: item.score, reverse=True),
            risk_score=risk_score,
            recommendation=recommendation,
        )
