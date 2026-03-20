from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from app.models.schemas import AnalyzeRequest, AnalyzeResponse


class AuditAgent:
    """Persist minimal analysis audit trail for traceability."""

    def __init__(self) -> None:
        default_log = Path(__file__).resolve().parents[2] / "audit_logs" / "analysis_audit.jsonl"
        configured = os.getenv("AUDIT_LOG_PATH")
        self.log_path = Path(configured) if configured else default_log
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def record(self, request: AnalyzeRequest, response: AnalyzeResponse) -> str:
        audit_id = f"AUD-{uuid4().hex[:12]}"
        event = {
            "audit_id": audit_id,
            "timestamp": datetime.now(UTC).isoformat(),
            "event_type": request.event_type,
            "alert_id": request.payload.alert_id,
            "risk_score": response.risk_score,
            "recommendation": response.recommendation,
            "policy": response.policy_decision.model_dump() if response.policy_decision else None,
        }
        with self.log_path.open("a", encoding="utf-8") as fp:
            fp.write(json.dumps(event, ensure_ascii=False) + "\n")
        return audit_id

    def read_recent(self, limit: int = 20) -> list[dict[str, object]]:
        if limit <= 0:
            return []

        if not self.log_path.exists():
            return []

        lines = self.log_path.read_text(encoding="utf-8").splitlines()
        events: list[dict[str, object]] = []
        for line in reversed(lines[-limit:]):
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return list(reversed(events))