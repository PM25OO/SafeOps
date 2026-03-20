import { ExtensionMessage } from "./api/protocol";

interface PopupDashboard {
  pluginEnabled: boolean;
  backendConnected: boolean;
  llmConnected: boolean;
  processedAlerts: number;
  blockedAlerts: number;
}

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

function setStatus(dot: HTMLElement, label: HTMLElement, ok: boolean, okText = "在线", badText = "离线"): void {
  dot.classList.remove("status-ok", "status-bad");
  dot.classList.add(ok ? "status-ok" : "status-bad");
  label.textContent = ok ? okText : badText;
}

async function refreshDashboard(): Promise<void> {
  const dashboard = await sendMessage<PopupDashboard>({ type: "GET_POPUP_DASHBOARD" });

  const toggle = document.getElementById("plugin-toggle") as HTMLInputElement;
  const toggleLabel = document.getElementById("toggle-label") as HTMLSpanElement;
  const backendDot = document.getElementById("backend-dot") as HTMLElement;
  const backendStatus = document.getElementById("backend-status") as HTMLElement;
  const llmDot = document.getElementById("llm-dot") as HTMLElement;
  const llmStatus = document.getElementById("llm-status") as HTMLElement;
  const processedCount = document.getElementById("processed-count") as HTMLElement;
  const blockedCount = document.getElementById("blocked-count") as HTMLElement;

  toggle.checked = dashboard.pluginEnabled;
  toggleLabel.textContent = dashboard.pluginEnabled ? "已启用" : "已禁用";

  setStatus(backendDot, backendStatus, dashboard.backendConnected);
  setStatus(llmDot, llmStatus, dashboard.llmConnected, "可用", "不可用");

  processedCount.textContent = String(dashboard.processedAlerts);
  blockedCount.textContent = String(dashboard.blockedAlerts);
}

async function initPopup(): Promise<void> {
  const toggle = document.getElementById("plugin-toggle") as HTMLInputElement;
  const refreshBtn = document.getElementById("refresh-btn") as HTMLButtonElement;
  const openOptionsBtn = document.getElementById("open-options") as HTMLButtonElement;
  const openAuditBtn = document.getElementById("open-audit") as HTMLButtonElement;

  toggle.addEventListener("change", async () => {
    await sendMessage({
      type: "UPDATE_SETTINGS",
      payload: { pluginEnabled: toggle.checked },
    });
    await refreshDashboard();
  });

  refreshBtn.addEventListener("click", () => {
    void refreshDashboard();
  });

  openOptionsBtn.addEventListener("click", () => {
    void chrome.runtime.openOptionsPage();
  });

  openAuditBtn.addEventListener("click", () => {
    void chrome.tabs.create({ url: chrome.runtime.getURL("audit.html") });
  });

  await refreshDashboard();
}

void initPopup();
