import { AllowlistConfig, ExtensionMessage, ParserRules, PluginSettings } from "./api/protocol";
import {
  normalizeBackendBaseUrl,
  parseImportedOptions,
  parseParserRulesText,
} from "./options-logic";

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

function applySettingsToForm(settings: Partial<PluginSettings>): void {
  if (typeof settings.backendBaseUrl === "string") {
    (document.getElementById("backend-url") as HTMLInputElement).value = settings.backendBaseUrl;
  }
  if (settings.parserRules) {
    (document.getElementById("parser-rules") as HTMLTextAreaElement).value = JSON.stringify(settings.parserRules, null, 2);
  }
  if (settings.allowlist) {
    renderAllowlist(settings.allowlist);
  }
}

function collectDraftSettings(parserRulesArea: HTMLTextAreaElement): Partial<PluginSettings> {
  return {
    backendBaseUrl: normalizeBackendBaseUrl((document.getElementById("backend-url") as HTMLInputElement).value),
    allowlist: collectAllowlist(),
    parserRules: parseParserRulesText(parserRulesArea.value),
  };
}

async function loadOptions(): Promise<PluginSettings> {
  const settings = await sendMessage<PluginSettings>({ type: "LOAD_SETTINGS" });
  applySettingsToForm(settings);
  return settings;
}

async function initOptions(): Promise<void> {
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const testBtn = document.getElementById("test-btn") as HTMLButtonElement;
  const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
  const importBtn = document.getElementById("import-json") as HTMLButtonElement;
  const exportBtn = document.getElementById("export-json") as HTMLButtonElement;
  const formatBtn = document.getElementById("format-json") as HTMLButtonElement;
  const importFile = document.getElementById("import-file") as HTMLInputElement;
  const parserRulesArea = document.getElementById("parser-rules") as HTMLTextAreaElement;

  await loadOptions();

  saveBtn.addEventListener("click", async () => {
    try {
      const payload = collectDraftSettings(parserRulesArea);
      const updated = await sendMessage<PluginSettings>({ type: "UPDATE_SETTINGS", payload });
      applySettingsToForm(updated);
      setStatus("✅ 配置已保存");
    } catch (error) {
      setStatus(`❌ 保存失败：${error instanceof Error ? error.message : "未知错误"}`, true);
    }
  });

  testBtn.addEventListener("click", async () => {
    try {
      const payload = {
        backendBaseUrl: normalizeBackendBaseUrl((document.getElementById("backend-url") as HTMLInputElement).value),
      };
      const health = await sendMessage<{ backendConnected: boolean; llmConnected: boolean; llmMode?: string }>({
        type: "TEST_BACKEND_CONNECTION",
        payload,
      });
      if (health.backendConnected) {
        const modeText = health.llmMode === "qwen" ? "通义千问" : "本地模型";
        setStatus(`✅ 后端在线，LLM 模块：${modeText}`);
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
    try {
      const content = await file.text();
      const imported = parseImportedOptions(content, collectAllowlist());
      applySettingsToForm(imported);
      setStatus("✅ JSON 已导入，请点击保存配置使其生效");
    } catch (error) {
      setStatus(`❌ 导入失败：${error instanceof Error ? error.message : "未知错误"}`, true);
    } finally {
      importFile.value = "";
    }
  });

  formatBtn.addEventListener("click", () => {
    try {
      const parsed = parseParserRulesText(parserRulesArea.value);
      parserRulesArea.value = JSON.stringify(parsed, null, 2);
      setStatus("✅ JSON 格式化完成");
    } catch (error) {
      setStatus(`❌ JSON格式错误：${error instanceof Error ? error.message : "未知错误"}`, true);
    }
  });

  exportBtn.addEventListener("click", () => {
    try {
      const payload = collectDraftSettings(parserRulesArea);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `safeops-options-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatus("✅ 配置已导出");
    } catch (error) {
      setStatus(`❌ 导出失败：${error instanceof Error ? error.message : "未知错误"}`, true);
    }
  });

  resetBtn.addEventListener("click", async () => {
    try {
      const defaults = await sendMessage<PluginSettings>({ type: "GET_DEFAULT_SETTINGS" });
      const payload: Partial<PluginSettings> = {
        backendBaseUrl: defaults.backendBaseUrl,
        allowlist: defaults.allowlist,
        parserRules: defaults.parserRules,
      };
      const updated = await sendMessage<PluginSettings>({ type: "UPDATE_SETTINGS", payload });
      applySettingsToForm(updated);
      setStatus("✅ 已恢复默认配置");
    } catch (error) {
      setStatus(`❌ 重置失败：${error instanceof Error ? error.message : "未知错误"}`, true);
    }
  });
}

void initOptions();
