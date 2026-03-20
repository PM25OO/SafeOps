import { ActionId, AllowlistConfig, AnalyzeResultView, ExtensionMessage, ParsedAlertContext } from "./api/protocol";

interface SidePanelData {
  context?: ParsedAlertContext;
  analysis?: AnalyzeResultView;
  allowlist?: AllowlistConfig;
}

const ACTION_LABELS: Record<ActionId, string> = {
  query_asset: "查询资产",
  watch_alert: "持续监控",
  collect_forensics: "收集取证",
  create_incident_ticket: "上报工单",
  block_ip: "一键封禁",
  isolate_host: "隔离主机",
  auto_restart_server: "自动重启服务器",
};

function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "Unknown extension error"));
        return;
      }
      resolve(response.data as T);
    });
  });
}

function streamText(target: HTMLElement, text: string, speedMs = 14): void {
  target.textContent = "";
  let index = 0;
  const timer = setInterval(() => {
    index += 1;
    target.textContent = text.slice(0, index);
    if (index >= text.length) {
      clearInterval(timer);
    }
  }, speedMs);
}

function showActionModal(action: ActionId, onConfirm: () => Promise<void>): void {
  const modal = document.getElementById("action-modal") as HTMLDivElement;
  const confirmText = document.getElementById("confirm-text") as HTMLParagraphElement;
  const confirmBtn = document.getElementById("confirm-action") as HTMLButtonElement;
  const cancelBtn = document.getElementById("cancel-action") as HTMLButtonElement;

  confirmText.textContent = `确认执行动作 [${ACTION_LABELS[action]}]？该操作将写入审计日志。`;
  modal.classList.add("open");

  const close = (): void => {
    modal.classList.remove("open");
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;
  };

  cancelBtn.onclick = () => close();
  confirmBtn.onclick = () => {
    void onConfirm().finally(close);
  };
}

function renderActions(data: SidePanelData): void {
  const group = document.getElementById("action-group") as HTMLDivElement;
  const status = document.getElementById("action-status") as HTMLParagraphElement;
  group.innerHTML = "";

  const actions = data.analysis?.suggested_actions ?? [];
  if (actions.length === 0) {
    status.textContent = "暂无可执行动作。";
    return;
  }

  for (const action of actions) {
    const btn = document.createElement("button");
    btn.textContent = ACTION_LABELS[action] ?? action;

    const allowed = data.allowlist ? data.allowlist[action] : true;
    if (!allowed) {
      btn.disabled = true;
      btn.title = "该动作被操作白名单禁用";
    }

    btn.addEventListener("click", () => {
      showActionModal(action, async () => {
        try {
          const result = await sendMessage<{ executed: boolean; executedAt: string }>({
            type: "EXECUTE_ACTION",
            payload: {
              action,
              auditId: data.analysis?.audit_id,
            },
          });
          status.textContent = `✅ ${ACTION_LABELS[action]} 已执行 (${result.executedAt})`;
        } catch (error) {
          status.textContent = `❌ 执行失败：${error instanceof Error ? error.message : "未知错误"}`;
        }
      });
    });

    group.appendChild(btn);
  }
}

async function initSidePanel(): Promise<void> {
  const contextPre = document.getElementById("context-pre") as HTMLPreElement;
  const chatStream = document.getElementById("chat-stream") as HTMLDivElement;

  const data = await sendMessage<SidePanelData>({ type: "GET_SIDEPANEL_DATA" });

  if (data.context) {
    contextPre.textContent = JSON.stringify(data.context, null, 2);
  } else {
    contextPre.textContent = "暂无上下文，请回到页面点击悬浮球触发分析。";
  }

  const chatText = data.analysis?.ai_decision?.reasoning
    ? `【AI研判】${data.analysis.ai_decision.reasoning}\n\n【结论】${data.analysis.ai_decision.summary ?? "-"}`
    : "暂无研判结果，请先在页面触发一次分析流程。";
  streamText(chatStream, chatText);

  renderActions(data);
}

void initSidePanel();
