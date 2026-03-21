from __future__ import annotations

import json
import os

import httpx

from app.models.schemas import AIDecision, AlertPayload, AnalyzeResponse


class LLMBridgeAgent:
    """Bridge agent for Qwen-compatible chat completion with safe fallback."""

    FUNCTION_NAME = "submit_security_decision"
    FUNCTION_SCHEMA = {
        "type": "object",
        "properties": {
            "summary": {"type": "string", "minLength": 1, "maxLength": 500},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "suggested_action": {
                "type": "string",
                "enum": ["monitor", "manual_review", "block_and_isolate"],
            },
            "reasoning": {"type": "string", "minLength": 1, "maxLength": 1000},
        },
        "required": ["summary", "confidence", "suggested_action", "reasoning"],
        "additionalProperties": False,
    }

    def __init__(self) -> None:
        self.api_key = os.getenv("QWEN_API_KEY", "").strip()
        self.base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").rstrip("/")
        self.model = os.getenv("QWEN_MODEL", "qwen-plus")
        self.timeout_seconds = float(os.getenv("LLM_TIMEOUT_SECONDS", "8"))

    def health_summary(self) -> dict[str, object]:
        if not self.api_key:
            return {
                "llm_connected": True,
                "mode": "mock",
                "reason": "QWEN_API_KEY not configured, using mock decisions",
                "model": self.model,
            }
        return {
            "llm_connected": True,
            "mode": "qwen",
            "reason": "QWEN_API_KEY detected, using live Qwen API",
            "model": self.model,
        }

    def enhance(self, payload: AlertPayload, rule_result: AnalyzeResponse) -> AIDecision:
        if not self.api_key:
            return self._mock_decision(rule_result)

        try:
            return self._call_qwen(payload=payload, rule_result=rule_result)
        except Exception:
            return self._mock_decision(rule_result)

    def _call_qwen(self, payload: AlertPayload, rule_result: AnalyzeResponse) -> AIDecision:
        prompt = {
            "task": "请评估安全告警并严格按 JSON 输出决策结果。",
            "response_language": "简体中文（zh-CN）",
            "field_requirements": {
                "summary": "必须使用简体中文，内容简洁明确。",
                "reasoning": "必须使用简体中文，说明判断依据与风险点。",
            },
            "required_json_schema": self.FUNCTION_SCHEMA,
            "alert": payload.model_dump(),
            "rule_result": {
                "risk_score": rule_result.risk_score,
                "recommendation": rule_result.recommendation,
            },
        }

        request_body = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是 SOC 安全助手。必须调用函数工具并仅返回可执行决策。summary 和 reasoning 必须为简体中文。",
                },
                {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
            ],
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": self.FUNCTION_NAME,
                        "description": "提交结构化安全决策结果，用于 SOC 处置。",
                        "parameters": self.FUNCTION_SCHEMA,
                    },
                }
            ],
            "tool_choice": {
                "type": "function",
                "function": {"name": self.FUNCTION_NAME},
            },
            "temperature": 0.1,
        }

        with httpx.Client(timeout=self.timeout_seconds) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=request_body,
            )
            response.raise_for_status()
            body = response.json()

        message = body["choices"][0]["message"]
        parsed = self._extract_decision_payload(message)

        confidence = parsed.get("confidence", 0.6)
        try:
            confidence_value = float(confidence)
        except (TypeError, ValueError):
            confidence_value = 0.6
        confidence_value = max(0.0, min(1.0, confidence_value))

        suggested_action = self._normalize_suggested_action(
            parsed.get("suggested_action"),
            fallback=rule_result.recommendation,
        )

        return AIDecision(
            summary=str(parsed.get("summary", "模型已生成决策摘要。"))[:500],
            confidence=confidence_value,
            suggested_action=suggested_action,
            reasoning=str(parsed.get("reasoning", "由通义千问生成决策依据。"))[:1000],
        )

    def _extract_decision_payload(self, message: dict[str, object]) -> dict[str, object]:
        tool_calls = message.get("tool_calls")
        if isinstance(tool_calls, list) and tool_calls:
            first_call = tool_calls[0]
            if isinstance(first_call, dict):
                function_part = first_call.get("function")
                if isinstance(function_part, dict):
                    arguments = function_part.get("arguments")
                    if isinstance(arguments, str) and arguments.strip():
                        return self._extract_json(arguments)

        content = message.get("content", "")
        if isinstance(content, list):
            text_parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str):
                        text_parts.append(text)
            content = "\n".join(text_parts)

        if not isinstance(content, str):
            content = str(content)

        return self._extract_json(content)

    def _normalize_suggested_action(self, action: object, fallback: str) -> str:
        allowed_actions = {"monitor", "manual_review", "block_and_isolate"}
        if isinstance(action, str) and action in allowed_actions:
            return action
        return fallback

    def _extract_json(self, content: str) -> dict[str, object]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start >= 0 and end > start:
                return json.loads(content[start : end + 1])
            raise

    def _mock_decision(self, rule_result: AnalyzeResponse) -> AIDecision:
        if rule_result.risk_score >= 85:
            return AIDecision(
                summary="高置信度高风险告警，建议先隔离并快速核查。",
                confidence=0.88,
                suggested_action="block_and_isolate",
                reasoning="规则评分较高且存在多个高风险迹象。",
            )
        if rule_result.risk_score >= 60:
            return AIDecision(
                summary="中高风险事件，建议升级给分析师复核。",
                confidence=0.74,
                suggested_action="manual_review",
                reasoning="风险等级提示潜在威胁，需人工进一步确认。",
            )
        return AIDecision(
            summary="低风险信号，建议持续监控。",
            confidence=0.69,
            suggested_action="monitor",
            reasoning="当前规则未发现明显恶意指标。",
        )