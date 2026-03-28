import { MessageRouter } from "./api/message-router";
import {
  ActionId,
  AnalyzeResultView,
  BackendErrorCode,
  ExtensionMessage,
  ParsedAlertContext,
  PluginSettings,
} from "./api/protocol";
import {
  DEFAULT_SETTINGS,
  bumpDailyStats,
  loadDailyStats,
  loadSettings,
  saveLatestAnalysis,
  saveLatestContext,
  updateSettings,
} from "./state/settings";

const router = new MessageRouter();
const EXTENSION_CONTEXT_INVALIDATED_ERROR = "Extension context invalidated.";
const DEFAULT_SIDE_PANEL_PATH = "sidepanel.html";
const BACKEND_REQUEST_TIMEOUT_MS = 8000;
const BACKEND_MAX_RETRIES = 1;
const BACKEND_RETRY_DELAY_MS = 250;

function ensureGlobalSidePanelOptions(): void {
  void chrome.sidePanel.setOptions({
    path: DEFAULT_SIDE_PANEL_PATH,
    enabled: true,
  });
}

class BackendRequestError extends Error {
  constructor(
    public readonly code: BackendErrorCode,
    message: string,
    public readonly status: number | undefined,
    public readonly retryable: boolean,
    public readonly attempt: number,
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

function isContextInvalidatedError(error: unknown): boolean {
  return error instanceof Error && /Extension context invalidated/i.test(error.message);
}

function normalizeRouterError(error: unknown): string {
  if (isContextInvalidatedError(error)) {
    return EXTENSION_CONTEXT_INVALIDATED_ERROR;
  }

  if (error instanceof BackendRequestError) {
    const details = [`${error.code}`, error.message, `attempt=${error.attempt}`];
    if (typeof error.status === "number") {
      details.push(`status=${error.status}`);
    }
    return details.join(" | ");
  }

  return error instanceof Error ? error.message : "Unknown error";
}

function buildRequestHeaders(_settings: PluginSettings): Record<string, string> {
  void _settings;
  return {
    "Content-Type": "application/json",
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeBackendError(error: unknown, attempt: number): BackendRequestError {
  if (error instanceof BackendRequestError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new BackendRequestError(
      "BACKEND_TIMEOUT",
      `Backend request timed out after ${BACKEND_REQUEST_TIMEOUT_MS}ms.`,
      undefined,
      true,
      attempt,
    );
  }

  if (error instanceof TypeError) {
    return new BackendRequestError(
      "BACKEND_NETWORK",
      "Backend request failed due to network/runtime issue.",
      undefined,
      true,
      attempt,
    );
  }

  if (error instanceof Error) {
    return new BackendRequestError("BACKEND_NETWORK", error.message, undefined, false, attempt);
  }

  return new BackendRequestError("BACKEND_NETWORK", "Unknown backend request error.", undefined, false, attempt);
}

interface BackendRequestOptions {
  timeoutMs?: number;
  retries?: number;
}

async function requestBackendJson<T>(
  settings: PluginSettings,
  path: string,
  init: RequestInit,
  options: BackendRequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? BACKEND_REQUEST_TIMEOUT_MS;
  const retries = options.retries ?? BACKEND_MAX_RETRIES;
  const url = `${settings.backendBaseUrl}${path}`;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...buildRequestHeaders(settings),
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BackendRequestError(
          "BACKEND_HTTP",
          `Backend request failed with status ${response.status}.`,
          response.status,
          response.status >= 500 || response.status === 429,
          attempt,
        );
      }

      try {
        return (await response.json()) as T;
      } catch {
        throw new BackendRequestError(
          "BACKEND_RESPONSE_PARSE",
          "Backend response JSON parse failed.",
          response.status,
          false,
          attempt,
        );
      }
    } catch (error) {
      const normalized = normalizeBackendError(error, attempt);
      if (normalized.retryable && attempt <= retries) {
        await delay(BACKEND_RETRY_DELAY_MS * attempt);
        continue;
      }

      throw normalized;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new BackendRequestError("BACKEND_NETWORK", "Backend request exhausted all retries.", undefined, false, retries + 1);
}

async function getBackendHealth(settings: PluginSettings): Promise<{ backendConnected: boolean; llmConnected: boolean; llmMode?: string }> {
  let backendConnected = false;
  let llmConnected = false;
  let llmMode: string | undefined;

  try {
    await requestBackendJson<Record<string, unknown>>(
      settings,
      "/health",
      { method: "GET" },
      { retries: 0, timeoutMs: 4000 },
    );
    backendConnected = true;
  } catch {
    backendConnected = false;
  }

  try {
    const llmBody = await requestBackendJson<{ llm_connected?: boolean; mode?: string }>(
      settings,
      "/health/llm",
      { method: "GET" },
      { retries: 0, timeoutMs: 4000 },
    );
    llmConnected = Boolean(llmBody.llm_connected);
    llmMode = llmBody.mode;
  } catch {
    llmConnected = false;
  }

  return { backendConnected, llmConnected, llmMode };
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
  const result = await requestBackendJson<AnalyzeResultView>(
    settings,
    "/analyze",
    {
      method: "POST",
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
    },
    { retries: BACKEND_MAX_RETRIES, timeoutMs: BACKEND_REQUEST_TIMEOUT_MS },
  );

  await Promise.all([
    saveLatestContext(payload),
    saveLatestAnalysis(result),
    bumpDailyStats(result.recommendation === "block_and_isolate"),
  ]);
  return result;
});

router.register("GET_AUDIT_LOGS", async () => {
  const settings = await loadSettings();
  return requestBackendJson<{ items: unknown[] }>(
    settings,
    "/audit/recent?limit=50",
    { method: "GET" },
    { retries: 0, timeoutMs: 5000 },
  );
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

chrome.runtime.onInstalled.addListener(() => {
  ensureGlobalSidePanelOptions();
});

chrome.runtime.onStartup.addListener(() => {
  ensureGlobalSidePanelOptions();
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === "OPEN_SIDE_PANEL") {
    const windowId = sender.tab?.windowId;
    const tabId = sender.tab?.id;

    // Ensure side panel behavior is global (window-level), not per-tab.
    ensureGlobalSidePanelOptions();

    // Must be called directly in user-gesture-triggered callback.
    if (typeof windowId === "number") {
      void chrome.sidePanel
        .open({ windowId })
        .then(() => {
          sendResponse({ ok: true, data: { opened: true } });
        })
        .catch((error) => {
          sendResponse({ ok: false, error: normalizeRouterError(error) });
        });
      return true;
    }

    // Fallback for unexpected sender shape.
    if (typeof tabId === "number") {
      void chrome.sidePanel
        .open({ tabId })
        .then(() => {
          sendResponse({ ok: true, data: { opened: true } });
        })
        .catch((error) => {
          sendResponse({ ok: false, error: normalizeRouterError(error) });
        });
      return true;
    }

    sendResponse({ ok: false, error: "No sender tab/window information for opening side panel." });
    return true;
  }

  void (async () => {
    const response = await router.handle(message, sender);
    sendResponse(response);
  })().catch((error) => {
    sendResponse({ ok: false, error: normalizeRouterError(error) });
  });

  return true;
});
