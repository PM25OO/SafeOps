import { AllowlistConfig, ExtensionMessage, ParserRules, PluginSettings } from "./api/protocol";

const ALLOWLIST_LABELS: Array<{ key: keyof AllowlistConfig; label: string }> = [
  { key: "query_asset", label: "查询资产" },
  { key: "watch_alert", label: "持续监控告警" },
  { key: "collect_forensics", label: "收集取证信息" },
  { key: "create_incident_ticket", label: "上报工单" },
  { key: "block_ip", label: "一键封禁 IP" },
  { key: "isolate_host", label: "隔离主机" },
  { key: "auto_restart_server", label: "自动重启服务器" },
];

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

function setStatus(text: string, isError = false): void {
  const status = document.getElementById("status-text") as HTMLParagraphElement;
  status.style.color = isError ? "#fda4af" : "#93c5fd";
  status.textContent = text;
}

function renderAllowlist(allowlist: AllowlistConfig): void {
  const group = document.getElementById("allowlist-group") as HTMLDivElement;
  group.innerHTML = "";

  for (const item of ALLOWLIST_LABELS) {
    const wrapper = document.createElement("label");
    wrapper.className = "row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.key = item.key;
    input.checked = allowlist[item.key];

    const text = document.createElement("span");
    text.textContent = item.label;

    wrapper.appendChild(input);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }
}

function collectAllowlist(): AllowlistConfig {
  const result: AllowlistConfig = {
    query_asset: false,
    watch_alert: false,
    collect_forensics: false,
    create_incident_ticket: false,
    block_ip: false,
    isolate_host: false,
    auto_restart_server: false,
  };

  for (const item of ALLOWLIST_LABELS) {
    const input = document.querySelector<HTMLInputElement>(`input[data-key="${item.key}"]`);
    result[item.key] = Boolean(input?.checked);
  }
  return result;
}

function parseParserRules(text: string): ParserRules {
  if (!text.trim()) {
    return {};
  }
  const parsed = JSON.parse(text) as ParserRules;
  const normalized: ParserRules = {};
  for (const key of ["alertId", "title", "severity", "sourceIp", "asset", "user", "timestamp"] as const) {
    const value = parsed[key];
    if (Array.isArray(value)) {
      normalized[key] = value.map((item) => String(item).trim()).filter(Boolean);
    }
  }
  return normalized;
}

async function loadOptions(): Promise<PluginSettings> {
  const settings = await sendMessage<PluginSettings>({ type: "LOAD_SETTINGS" });
  (document.getElementById("backend-url") as HTMLInputElement).value = settings.backendBaseUrl;
  (document.getElementById("api-key") as HTMLInputElement).value = settings.apiKey;
  (document.getElementById("parser-rules") as HTMLTextAreaElement).value = JSON.stringify(settings.parserRules, null, 2);
  renderAllowlist(settings.allowlist);
  return settings;
}

async function initOptions(): Promise<void> {
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const testBtn = document.getElementById("test-btn") as HTMLButtonElement;
  const importBtn = document.getElementById("import-json") as HTMLButtonElement;
  const formatBtn = document.getElementById("format-json") as HTMLButtonElement;
  const importFile = document.getElementById("import-file") as HTMLInputElement;
  const parserRulesArea = document.getElementById("parser-rules") as HTMLTextAreaElement;

  await loadOptions();

  saveBtn.addEventListener("click", async () => {
    try {
      const payload: Partial<PluginSettings> = {
        backendBaseUrl: (document.getElementById("backend-url") as HTMLInputElement).value.trim(),
        apiKey: (document.getElementById("api-key") as HTMLInputElement).value.trim(),
        allowlist: collectAllowlist(),
        parserRules: parseParserRules(parserRulesArea.value),
      };
      await sendMessage<PluginSettings>({ type: "UPDATE_SETTINGS", payload });
      setStatus("✅ 配置已保存");
    } catch (error) {
      setStatus(`❌ 保存失败：${error instanceof Error ? error.message : "未知错误"}`, true);
    }
  });

  testBtn.addEventListener("click", async () => {
    try {
      const dashboard = await sendMessage<{ backendConnected: boolean; llmConnected: boolean }>({
        type: "GET_POPUP_DASHBOARD",
      });
      if (dashboard.backendConnected) {
        setStatus(`✅ 后端在线，模型状态：${dashboard.llmConnected ? "可用" : "不可用"}`);
      } else {
        setStatus("❌ 后端离线，请检查地址与服务状态", true);
      }
    } catch (error) {
      setStatus(`❌ 连接测试失败：${error instanceof Error ? error.message : "未知错误"}`, true);
    }
  });

  importBtn.addEventListener("click", () => importFile.click());

  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    if (!file) {
      return;
    }
    const content = await file.text();
    parserRulesArea.value = content;
    setStatus("✅ JSON 已导入，请保存配置");
  });

  formatBtn.addEventListener("click", () => {
    try {
      const parsed = parseParserRules(parserRulesArea.value);
      parserRulesArea.value = JSON.stringify(parsed, null, 2);
      setStatus("✅ JSON 格式化完成");
    } catch (error) {
      setStatus(`❌ JSON格式错误：${error instanceof Error ? error.message : "未知错误"}`, true);
    }
  });
}

void initOptions();
