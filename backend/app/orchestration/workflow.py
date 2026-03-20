from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.rule_engine_agent import RuleEngineAgent
from app.models.schemas import AnalyzeRequest, AnalyzeResponse


class AnalyzeState(TypedDict):
    request: AnalyzeRequest
    response: AnalyzeResponse | None


class AnalysisWorkflow:
    """Phase 1 workflow: request -> rule engine."""

    def __init__(self) -> None:
        self.rule_engine = RuleEngineAgent()
        graph = StateGraph(AnalyzeState)
        graph.add_node("rule_engine", self._run_rule_engine)
        graph.set_entry_point("rule_engine")
        graph.add_edge("rule_engine", END)
        self.compiled_graph = graph.compile()

    def _run_rule_engine(self, state: AnalyzeState) -> AnalyzeState:
        response = self.rule_engine.analyze(state["request"].payload)
        return {"request": state["request"], "response": response}

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        output_state = self.compiled_graph.invoke({"request": request, "response": None})
        response = output_state["response"]
        if response is None:
            raise RuntimeError("Analysis workflow failed to produce response")
        return response
