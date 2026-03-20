from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.audit_agent import AuditAgent
from app.agents.audit_policy_agent import AuditPolicyAgent
from app.agents.llm_bridge_agent import LLMBridgeAgent
from app.agents.rule_engine_agent import RuleEngineAgent
from app.models.schemas import AnalyzeRequest, AnalyzeResponse


class AnalyzeState(TypedDict):
    request: AnalyzeRequest
    response: AnalyzeResponse | None
    audit_id: str | None


class AnalysisWorkflow:
    """Phase 1 workflow: rule engine -> AI enhance -> policy gate -> audit."""

    def __init__(self) -> None:
        self.rule_engine = RuleEngineAgent()
        self.llm_bridge = LLMBridgeAgent()
        self.policy_agent = AuditPolicyAgent()
        self.audit_agent = AuditAgent()

        graph = StateGraph(AnalyzeState)
        graph.add_node("rule_engine", self._run_rule_engine)
        graph.add_node("ai_enhance", self._run_ai_enhance)
        graph.add_node("policy_gate", self._run_policy_gate)
        graph.add_node("audit", self._run_audit)

        graph.set_entry_point("rule_engine")
        graph.add_edge("rule_engine", "ai_enhance")
        graph.add_edge("ai_enhance", "policy_gate")
        graph.add_edge("policy_gate", "audit")
        graph.add_edge("audit", END)
        self.compiled_graph = graph.compile()

    def _run_rule_engine(self, state: AnalyzeState) -> AnalyzeState:
        response = self.rule_engine.analyze(state["request"].payload)
        return {"request": state["request"], "response": response, "audit_id": None}

    def _run_ai_enhance(self, state: AnalyzeState) -> AnalyzeState:
        response = state["response"]
        if response is None:
            raise RuntimeError("Missing response before AI enhancement")

        ai_decision = self.llm_bridge.enhance(state["request"].payload, response)
        response.ai_decision = ai_decision

        if ai_decision.confidence >= 0.6:
            response.recommendation = ai_decision.suggested_action

        return {"request": state["request"], "response": response, "audit_id": state["audit_id"]}

    def _run_policy_gate(self, state: AnalyzeState) -> AnalyzeState:
        response = state["response"]
        if response is None:
            raise RuntimeError("Missing response before policy gate")

        policy_decision = self.policy_agent.evaluate(state["request"].payload, response)
        response.policy_decision = policy_decision
        response.suggested_actions = self._build_suggested_actions(response.recommendation)
        return {"request": state["request"], "response": response, "audit_id": state["audit_id"]}

    def _run_audit(self, state: AnalyzeState) -> AnalyzeState:
        response = state["response"]
        if response is None:
            raise RuntimeError("Missing response before audit")

        audit_id = self.audit_agent.record(state["request"], response)
        response.audit_id = audit_id
        return {"request": state["request"], "response": response, "audit_id": audit_id}

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        output_state = self.compiled_graph.invoke({"request": request, "response": None, "audit_id": None})
        response = output_state["response"]
        if response is None:
            raise RuntimeError("Analysis workflow failed to produce response")
        return response

    def llm_health(self) -> dict[str, object]:
        return self.llm_bridge.health_summary()

    def recent_audits(self, limit: int = 20) -> list[dict[str, object]]:
        return self.audit_agent.read_recent(limit=limit)

    def _build_suggested_actions(self, recommendation: str) -> list[str]:
        if recommendation == "block_and_isolate":
            return ["block_ip", "isolate_host", "create_incident_ticket"]
        if recommendation == "manual_review":
            return ["query_asset", "collect_forensics", "create_incident_ticket"]
        return ["query_asset", "watch_alert"]
