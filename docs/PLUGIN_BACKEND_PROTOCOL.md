# Plugin ↔ Backend 通信协议 (Phase 1)

## 目标

定义浏览器插件与后端 `/analyze` API 的 JSON 协议，用于告警上下文上报与分析结果回传。

## 上行消息 (插件 -> 后端)

### Endpoint

- `POST /analyze`

### Request Body

```json
{
  "event_type": "alert",
  "payload": {
    "alert_id": "ALT-2026-0001",
    "title": "Suspicious Login Attempt",
    "severity": "critical",
    "source_ip": "1.2.3.4",
    "asset": "prod-web-01",
    "user": "admin",
    "description": "raw extracted text",
    "timestamp": "2026-03-20T10:00:00Z"
  }
}
```

## 下行消息 (后端 -> 插件)

### Response Body

```json
{
  "matched_rules": [
    {
      "rule_id": "R001",
      "rule_name": "CriticalSeverity",
      "score": 90,
      "reason": "Alert severity is critical."
    }
  ],
  "risk_score": 93,
  "recommendation": "block_and_isolate"
}
```

## 字段约束

- `severity`: `low | medium | high | critical`
- `risk_score`: `0~100`
- `recommendation`: `monitor | manual_review | block_and_isolate`

## 错误约定

- `400`: 参数不合法 (Pydantic 校验失败)
- `500`: 内部错误
