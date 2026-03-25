from __future__ import annotations

from dataclasses import dataclass
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


@dataclass(slots=True)
class WorkflowExecutionError(Exception):
    error_code: str
    error_category: str
    stage: str
    message: str
    retryable: bool = False

    def as_dict(self) -> dict[str, object]:
        return {
            "error_code": self.error_code,
            "error_category": self.error_category,
            "stage": self.stage,
            "message": self.message,
            "retryable": self.retryable,
        }


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
        try:
            response = self.rule_engine.analyze(state["request"].payload)
            return {"request": state["request"], "response": response, "audit_id": None}
        except WorkflowExecutionError:
            raise
        except Exception as exc:
            raise WorkflowExecutionError(
                error_code="RULE_ENGINE_FAILURE",
                error_category="agent_execution_error",
                stage="rule_engine",
                message="RuleEngineAgent 执行失败",
            ) from exc

    def _run_ai_enhance(self, state: AnalyzeState) -> AnalyzeState:
        try:
            response = state["response"]
            if response is None:
                raise WorkflowExecutionError(
                    error_code="WORKFLOW_STATE_INVALID",
                    error_category="state_error",
                    stage="ai_enhance",
                    message="AI 增强阶段缺少上游响应",
                )

            ai_decision = self.llm_bridge.enhance(state["request"].payload, response)
            response.ai_decision = ai_decision

            if ai_decision.confidence >= 0.6:
                response.recommendation = ai_decision.suggested_action

            return {"request": state["request"], "response": response, "audit_id": state["audit_id"]}
        except WorkflowExecutionError:
            raise
        except Exception as exc:
            raise WorkflowExecutionError(
                error_code="LLM_ENHANCE_FAILURE",
                error_category="agent_execution_error",
                stage="ai_enhance",
                message="LLMBridgeAgent 执行失败",
                retryable=True,
            ) from exc

    def _run_policy_gate(self, state: AnalyzeState) -> AnalyzeState:
        try:
            response = state["response"]
            if response is None:
                raise WorkflowExecutionError(
                    error_code="WORKFLOW_STATE_INVALID",
                    error_category="state_error",
                    stage="policy_gate",
                    message="策略门控阶段缺少上游响应",
                )

            policy_decision = self.policy_agent.evaluate(state["request"].payload, response)
            response.policy_decision = policy_decision
            response.suggested_actions = self._build_suggested_actions(response.recommendation)
            return {"request": state["request"], "response": response, "audit_id": state["audit_id"]}
        except WorkflowExecutionError:
            raise
        except Exception as exc:
            raise WorkflowExecutionError(
                error_code="POLICY_GATE_FAILURE",
                error_category="agent_execution_error",
                stage="policy_gate",
                message="AuditPolicyAgent 执行失败",
            ) from exc

    def _run_audit(self, state: AnalyzeState) -> AnalyzeState:
        try:
            response = state["response"]
            if response is None:
                raise WorkflowExecutionError(
                    error_code="WORKFLOW_STATE_INVALID",
                    error_category="state_error",
                    stage="audit",
                    message="审计阶段缺少上游响应",
                )

            audit_id = self.audit_agent.record(state["request"], response)
            response.audit_id = audit_id
            return {"request": state["request"], "response": response, "audit_id": audit_id}
        except WorkflowExecutionError:
            raise
        except Exception as exc:
            raise WorkflowExecutionError(
                error_code="AUDIT_PERSIST_FAILURE",
                error_category="persistence_error",
                stage="audit",
                message="审计写入失败",
                retryable=True,
            ) from exc

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        try:
            output_state = self.compiled_graph.invoke({"request": request, "response": None, "audit_id": None})
        except WorkflowExecutionError:
            raise
        except Exception as exc:
            raise WorkflowExecutionError(
                error_code="WORKFLOW_EXECUTION_FAILURE",
                error_category="workflow_runtime_error",
                stage="orchestration",
                message="分析编排执行失败",
                retryable=True,
            ) from exc

        response = output_state["response"]
        if response is None:
            raise WorkflowExecutionError(
                error_code="WORKFLOW_EMPTY_RESPONSE",
                error_category="state_error",
                stage="orchestration",
                message="分析编排未生成响应",
            )
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
