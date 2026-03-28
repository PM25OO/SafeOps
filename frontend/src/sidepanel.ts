import { AnalyzeResultView, ParsedAlertContext } from "./api/protocol";
import { loadLatestPanelData } from "./state/settings";

const JSON_PREVIEW_LIMIT = 1200;

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing required element: ${id}`);
  }
  return el as T;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function stringifyPreview(value: unknown): string {
  if (value === undefined) {
    return "{}";
  }

  const serialized = JSON.stringify(value, null, 2) ?? "{}";
  if (serialized.length <= JSON_PREVIEW_LIMIT) {
    return serialized;
  }
  return `${serialized.slice(0, JSON_PREVIEW_LIMIT)}\n... (truncated)`;
}

function renderContext(context: unknown): void {
  const contextTitle = getEl<HTMLParagraphElement>("sp-context-title");
  const contextJson = getEl<HTMLElement>("sp-context-json");
  const record = asRecord(context);

  if (!record) {
    contextTitle.textContent = "暂无上下文数据。";
    contextJson.textContent = "{}";
    return;
  }

  const normalized = record as Partial<ParsedAlertContext>;
  const severity = normalized.severity ? String(normalized.severity).toUpperCase() : "UNKNOWN";
  const title = normalized.title ?? normalized.alertId ?? "未命名告警";
  contextTitle.textContent = `告警概览：${severity} · ${title}`;
  contextJson.textContent = stringifyPreview(record);
}

function renderAnalysis(analysis: unknown): void {
  const recommendationEl = getEl<HTMLElement>("sp-rec");
  const riskEl = getEl<HTMLElement>("sp-risk");
  const actionsEl = getEl<HTMLElement>("sp-actions");
  const summaryEl = getEl<HTMLParagraphElement>("sp-ai-summary");

  const record = asRecord(analysis);
  if (!record) {
    recommendationEl.textContent = "-";
    riskEl.textContent = "-";
    actionsEl.textContent = "-";
    summaryEl.textContent = "暂无 AI 摘要。";
    return;
  }

  const normalized = record as AnalyzeResultView;
  recommendationEl.textContent = normalized.recommendation ?? "-";
  riskEl.textContent = typeof normalized.risk_score === "number" ? String(normalized.risk_score) : "-";
  actionsEl.textContent = normalized.suggested_actions?.join(", ") ?? "-";
  summaryEl.textContent = normalized.ai_decision?.summary ?? "暂无 AI 摘要。";
}

async function refreshSidePanel(): Promise<void> {
  try {
    const { context, analysis } = await loadLatestPanelData();
    renderContext(context);
    renderAnalysis(analysis);
    getEl<HTMLElement>("sp-last-sync").textContent = new Date().toLocaleString("zh-CN", {
      hour12: false,
    });
  } catch (error) {
    console.error("Failed to refresh sidepanel:", error);
  }
}

async function initSidePanel(): Promise<void> {
  getEl<HTMLButtonElement>("sp-refresh").addEventListener("click", () => {
    void refreshSidePanel();
  });

  // Monitor storage changes to auto-refresh when new analysis arrives
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      const hasLatestContextChange = "latestContext" in changes;
      const hasLatestAnalysisChange = "latestAnalysis" in changes;

      if (hasLatestContextChange || hasLatestAnalysisChange) {
        void refreshSidePanel();
      }
    }
  });

  await refreshSidePanel();
}

void initSidePanel();