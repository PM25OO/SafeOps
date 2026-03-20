import { parseAlertContext } from "./parser/dom-parser";
import { ExtensionMessage } from "./api/protocol";

interface AnalyzeViewModel {
  risk_score?: number;
  recommendation?: string;
  audit_id?: string;
  ai_decision?: {
    summary?: string;
    confidence?: number;
  };
  policy_decision?: {
    requires_human_confirm?: boolean;
    reason?: string;
  };
}

const PANEL_ID = "safeops-ai-panel";

function ensurePanel(): HTMLDivElement {
  let panel = document.getElementById(PANEL_ID) as HTMLDivElement | null;
  if (panel) {
    return panel;
  }

  panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.position = "fixed";
  panel.style.top = "16px";
  panel.style.right = "16px";
  panel.style.width = "320px";
  panel.style.maxWidth = "90vw";
  panel.style.zIndex = "2147483647";
  panel.style.background = "#0b1220";
  panel.style.color = "#e2e8f0";
  panel.style.border = "1px solid #334155";
  panel.style.borderRadius = "12px";
  panel.style.padding = "12px";
  panel.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
  panel.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  panel.style.fontSize = "12px";
  panel.style.lineHeight = "1.5";
  panel.textContent = "SafeOps AI 正在分析告警...";

  document.documentElement.appendChild(panel);
  return panel;
}

function renderPanel(title: string, lines: string[]): void {
  const panel = ensurePanel();
  panel.innerHTML = "";

  const heading = document.createElement("div");
  heading.textContent = title;
  heading.style.fontWeight = "700";
  heading.style.marginBottom = "8px";
  panel.appendChild(heading);

  for (const line of lines) {
    const item = document.createElement("div");
    item.textContent = line;
    panel.appendChild(item);
  }
}

function buildAnalyzeMessage(): ExtensionMessage {
  const payload = parseAlertContext(document);
  return {
    type: "ANALYZE_ALERT",
    payload,
    traceId: crypto.randomUUID(),
  };
}

function sendForAnalysis(): void {
  const message = buildAnalyzeMessage();
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("[SafeOps] sendMessage failed:", chrome.runtime.lastError.message);
      renderPanel("SafeOps AI 执行失败", [chrome.runtime.lastError.message ?? "Unknown extension runtime error"]);
      return;
    }

    if (!response?.ok) {
      renderPanel("SafeOps AI 执行失败", [response?.error ?? "Unknown error"]);
      return;
    }

    const result = (response.data ?? {}) as AnalyzeViewModel;
    const confidence = result.ai_decision?.confidence;
    const confidenceLabel = typeof confidence === "number" ? `${Math.round(confidence * 100)}%` : "N/A";
    const needsHuman = result.policy_decision?.requires_human_confirm ? "是" : "否";

    renderPanel("SafeOps AI 分析结果", [
      `风险分: ${result.risk_score ?? "N/A"}`,
      `建议: ${result.recommendation ?? "N/A"}`,
      `AI置信度: ${confidenceLabel}`,
      `需要人工确认: ${needsHuman}`,
      `审计ID: ${result.audit_id ?? "N/A"}`,
      `摘要: ${result.ai_decision?.summary ?? "-"}`,
    ]);

    console.debug("[SafeOps] analyze response:", response);
  });
}

window.addEventListener("load", () => {
  sendForAnalysis();
});
