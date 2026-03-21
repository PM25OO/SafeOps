from __future__ import annotations

from app.agents.llm_bridge_agent import LLMBridgeAgent
from app.models.schemas import AlertPayload, AnalyzeResponse


def _sample_payload() -> AlertPayload:
    return AlertPayload(
        alert_id="ALT-200",
        title="Suspicious login",
        severity="high",
        source_ip="1.1.1.1",
        asset="prod-web-01",
        user="admin",
        description="Repeated failed logins followed by success",
    )


def _sample_rule_result() -> AnalyzeResponse:
    return AnalyzeResponse(matched_rules=[], risk_score=72, recommendation="manual_review")


class _FakeResponse:
    def __init__(self, body: dict[str, object]) -> None:
        self._body = body

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, object]:
        return self._body


def test_qwen_request_uses_function_calling_and_parses_tool_arguments(monkeypatch) -> None:
    monkeypatch.setenv("QWEN_API_KEY", "test-key")
    monkeypatch.setenv("QWEN_BASE_URL", "https://example.local/v1")

    captured: dict[str, object] = {}

    response_body = {
        "choices": [
            {
                "message": {
                    "tool_calls": [
                        {
                            "type": "function",
                            "function": {
                                "name": "submit_security_decision",
                                "arguments": '{"summary":"Escalate quickly","confidence":0.92,"suggested_action":"block_and_isolate","reasoning":"Multiple high-risk indicators."}',
                            },
                        }
                    ]
                }
            }
        ]
    }

    class _FakeClient:
        def __init__(self, timeout: float) -> None:
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb) -> bool:
            return False

        def post(self, url: str, headers: dict[str, str], json: dict[str, object]) -> _FakeResponse:
            captured["url"] = url
            captured["headers"] = headers
            captured["json"] = json
            return _FakeResponse(response_body)

    monkeypatch.setattr("app.agents.llm_bridge_agent.httpx.Client", _FakeClient)

    agent = LLMBridgeAgent()
    decision = agent.enhance(_sample_payload(), _sample_rule_result())

    assert decision.summary == "Escalate quickly"
    assert decision.confidence == 0.92
    assert decision.suggested_action == "block_and_isolate"

    request_body = captured["json"]
    assert isinstance(request_body, dict)
    assert "tools" in request_body
    assert request_body["tools"][0]["function"]["name"] == "submit_security_decision"
    assert request_body["tool_choice"]["function"]["name"] == "submit_security_decision"


def test_qwen_parses_json_from_message_content_when_tool_calls_missing(monkeypatch) -> None:
    monkeypatch.setenv("QWEN_API_KEY", "test-key")

    response_body = {
        "choices": [
            {
                "message": {
                    "content": "```json\n{\"summary\":\"Needs manual validation\",\"confidence\":0.66,\"suggested_action\":\"manual_review\",\"reasoning\":\"Signal quality is medium.\"}\n```"
                }
            }
        ]
    }

    class _FakeClient:
        def __init__(self, timeout: float) -> None:
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb) -> bool:
            return False

        def post(self, url: str, headers: dict[str, str], json: dict[str, object]) -> _FakeResponse:
            return _FakeResponse(response_body)

    monkeypatch.setattr("app.agents.llm_bridge_agent.httpx.Client", _FakeClient)

    agent = LLMBridgeAgent()
    decision = agent.enhance(_sample_payload(), _sample_rule_result())

    assert decision.summary == "Needs manual validation"
    assert decision.suggested_action == "manual_review"
    assert decision.confidence == 0.66


def test_qwen_normalizes_invalid_action_and_clamps_confidence(monkeypatch) -> None:
    monkeypatch.setenv("QWEN_API_KEY", "test-key")

    response_body = {
        "choices": [
            {
                "message": {
                    "tool_calls": [
                        {
                            "type": "function",
                            "function": {
                                "name": "submit_security_decision",
                                "arguments": '{"summary":"Potential anomaly","confidence":2.0,"suggested_action":"shutdown_everything","reasoning":"Model output contains unsupported action."}',
                            },
                        }
                    ]
                }
            }
        ]
    }

    class _FakeClient:
        def __init__(self, timeout: float) -> None:
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb) -> bool:
            return False

        def post(self, url: str, headers: dict[str, str], json: dict[str, object]) -> _FakeResponse:
            return _FakeResponse(response_body)

    monkeypatch.setattr("app.agents.llm_bridge_agent.httpx.Client", _FakeClient)

    agent = LLMBridgeAgent()
    rule_result = _sample_rule_result()
    decision = agent.enhance(_sample_payload(), rule_result)

    assert decision.suggested_action == rule_result.recommendation
    assert decision.confidence == 1.0