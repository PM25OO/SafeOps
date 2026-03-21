import { MessageRouter } from "./api/message-router";
import {
  ActionId,
  AnalyzeResultView,
  ExtensionMessage,
  ParsedAlertContext,
  PluginSettings,
} from "./api/protocol";
import {
  DEFAULT_SETTINGS,
  bumpDailyStats,
  loadDailyStats,
  loadLatestPanelData,
  loadSettings,
  saveLatestAnalysis,
  saveLatestContext,
  updateSettings,
} from "./state/settings";

const router = new MessageRouter();

function buildRequestHeaders(_settings: PluginSettings): Record<string, string> {
  void _settings;
  return {
    "Content-Type": "application/json",
  };
}

async function getBackendHealth(settings: PluginSettings): Promise<{ backendConnected: boolean; llmConnected: boolean; llmMode?: string }> {
  try {
    const [healthResponse, llmResponse] = await Promise.all([
      fetch(`${settings.backendBaseUrl}/health`, { headers: buildRequestHeaders(settings) }),
      fetch(`${settings.backendBaseUrl}/health/llm`, { headers: buildRequestHeaders(settings) }),
    ]);

    const backendConnected = healthResponse.ok;
    let llmConnected = false;
    let llmMode: string | undefined;
    
    if (llmResponse.ok) {
      const llmBody = await llmResponse.json() as { llm_connected?: boolean; mode?: string };
      llmConnected = Boolean(llmBody.llm_connected);
      llmMode = llmBody.mode;
    }

    return { backendConnected, llmConnected, llmMode };
  } catch {
    return { backendConnected: false, llmConnected: false };
  }
}

router.register("PING", () => ({ status: "alive" }));

router.register("LOAD_SETTINGS", async () => loadSettings());

router.register("GET_DEFAULT_SETTINGS", async () => ({ ...DEFAULT_SETTINGS }));

router.register("UPDATE_SETTINGS", async (message) => {
  const partial = (message.payload ?? {}) as Partial<PluginSettings>;
  return updateSettings(partial);
});

router.register("GET_POPUP_DASHBOARD", async () => {
  const settings = await loadSettings();
  const [stats, health] = await Promise.all([loadDailyStats(), getBackendHealth(settings)]);
  return {
    pluginEnabled: settings.pluginEnabled,
    backendConnected: health.backendConnected,
    llmConnected: health.llmConnected,
    llmMode: health.llmMode,
    processedAlerts: stats.processedAlerts,
    blockedAlerts: stats.blockedAlerts,
  };
});

router.register("TEST_BACKEND_CONNECTION", async (message) => {
  const current = await loadSettings();
  const payload = (message.payload ?? {}) as Partial<Pick<PluginSettings, "backendBaseUrl">>;

  const merged: PluginSettings = {
    ...current,
    backendBaseUrl: payload.backendBaseUrl?.trim() || current.backendBaseUrl,
  };

  return getBackendHealth(merged);
});

router.register("ANALYZE_ALERT", async (message: ExtensionMessage) => {
  const settings = await loadSettings();
  if (!settings.pluginEnabled) {
    return {
      disabled: true,
      reason: "Plugin monitoring is disabled by user toggle.",
    };
  }

  const payload = (message.payload ?? {}) as ParsedAlertContext;
  const response = await fetch(`${settings.backendBaseUrl}/analyze`, {
    method: "POST",
    headers: buildRequestHeaders(settings),
    body: JSON.stringify({
      event_type: "alert",
      payload: {
        alert_id: payload.alertId,
        title: payload.title,
        severity: payload.severity,
        source_ip: payload.sourceIp,
        asset: payload.asset,
        user: payload.user,
        timestamp: payload.timestamp,
        description: payload.rawText,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend analyze failed with status ${response.status}`);
  }

  const result = await response.json() as AnalyzeResultView;
  await Promise.all([
    saveLatestContext(payload),
    saveLatestAnalysis(result),
    bumpDailyStats(result.recommendation === "block_and_isolate"),
  ]);
  return result;
});

router.register("OPEN_SIDE_PANEL", async (message, sender) => {
  const payload = (message.payload ?? {}) as { context?: ParsedAlertContext };
  if (payload.context) {
    await saveLatestContext(payload.context);
  }

  const tabId = sender?.tab?.id;
  if (typeof tabId !== "number") {
    return { opened: false, error: "Unable to locate target tab." };
  }

  if (!chrome.sidePanel?.open) {
    return { opened: false, error: "chrome.sidePanel API is not available." };
  }

  await chrome.sidePanel.setOptions({ tabId, path: "sidepanel.html", enabled: true });
  await chrome.sidePanel.open({ tabId });
  return { opened: true };
});

router.register("GET_SIDEPANEL_DATA", async () => {
  const settings = await loadSettings();
  const latest = await loadLatestPanelData();
  return {
    context: latest.context,
    analysis: latest.analysis,
    allowlist: settings.allowlist,
  };
});

router.register("GET_AUDIT_LOGS", async () => {
  const settings = await loadSettings();
  const response = await fetch(`${settings.backendBaseUrl}/audit/recent?limit=50`, {
    headers: buildRequestHeaders(settings),
  });
  if (!response.ok) {
    throw new Error(`Audit API failed with status ${response.status}`);
  }
  return response.json();
});

router.register("EXECUTE_ACTION", async (message) => {
  const settings = await loadSettings();
  const payload = (message.payload ?? {}) as { action?: ActionId; auditId?: string };
  const action = payload.action;

  if (!action) {
    throw new Error("Missing action id.");
  }

  if (!settings.allowlist[action]) {
    throw new Error(`Action '${action}' is blocked by allowlist policy.`);
  }

  return {
    executed: true,
    action,
    auditId: payload.auditId,
    executedAt: new Date().toISOString(),
    note: "Simulated execution completed. Integrate real executor in next phase.",
  };
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  router
    .handle(message, _sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown error" });
    });

  return true;
});
