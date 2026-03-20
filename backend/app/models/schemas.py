from typing import Literal

from pydantic import BaseModel, Field


class AlertPayload(BaseModel):
    alert_id: str
    title: str = ""
    severity: Literal["low", "medium", "high", "critical"] = "low"
    source_ip: str | None = None
    asset: str | None = None
    user: str | None = None
    description: str | None = None
    timestamp: str | None = None


class AnalyzeRequest(BaseModel):
    event_type: str = Field(default="alert", description="Input event type from plugin.")
    payload: AlertPayload


class RuleMatch(BaseModel):
    rule_id: str
    rule_name: str
    score: int = Field(ge=0, le=100)
    reason: str


class AIDecision(BaseModel):
    summary: str
    confidence: float = Field(ge=0.0, le=1.0)
    suggested_action: Literal["monitor", "manual_review", "block_and_isolate"]
    reasoning: str


class PolicyDecision(BaseModel):
    policy_id: str
    allow_execute: bool
    requires_human_confirm: bool
    reason: str


class AnalyzeResponse(BaseModel):
    matched_rules: list[RuleMatch]
    risk_score: int = Field(ge=0, le=100)
    recommendation: Literal["monitor", "manual_review", "block_and_isolate"]
    suggested_actions: list[str] = Field(default_factory=list)
    ai_decision: AIDecision | None = None
    policy_decision: PolicyDecision | None = None
    audit_id: str | None = None
