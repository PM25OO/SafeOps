import { DailyStats, PluginSettings } from "../api/protocol";

export const DEFAULT_SETTINGS: PluginSettings = {
  pluginEnabled: true,
  backendBaseUrl: "http://localhost:8000",
  allowlist: {
    query_asset: true,
    watch_alert: true,
    collect_forensics: true,
    create_incident_ticket: true,
    block_ip: true,
    isolate_host: false,
    auto_restart_server: false,
  },
  parserRules: {},
};

const SETTINGS_KEY = "pluginSettings";
const DAILY_STATS_KEY = "dailyStats";
const LATEST_CONTEXT_KEY = "latestContext";
const LATEST_ANALYSIS_KEY = "latestAnalysis";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getStorageSync<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

export function setStorageSync<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => resolve());
  });
}

export function getStorageLocal<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

export function setStorageLocal<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export async function loadSettings(): Promise<PluginSettings> {
  const stored = await getStorageSync<PluginSettings>(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored ?? {}),
    allowlist: {
      ...DEFAULT_SETTINGS.allowlist,
      ...(stored?.allowlist ?? {}),
    },
    parserRules: {
      ...DEFAULT_SETTINGS.parserRules,
      ...(stored?.parserRules ?? {}),
    },
  };
}

export async function updateSettings(partial: Partial<PluginSettings>): Promise<PluginSettings> {
  const current = await loadSettings();
  const merged: PluginSettings = {
    ...current,
    ...partial,
    allowlist: {
      ...current.allowlist,
      ...(partial.allowlist ?? {}),
    },
    parserRules: {
      ...current.parserRules,
      ...(partial.parserRules ?? {}),
    },
  };
  await setStorageSync(SETTINGS_KEY, merged);
  return merged;
}

export async function loadDailyStats(): Promise<DailyStats> {
  const stored = await getStorageLocal<DailyStats>(DAILY_STATS_KEY);
  const today = getTodayKey();
  if (!stored || stored.date !== today) {
    const reset: DailyStats = { date: today, processedAlerts: 0, blockedAlerts: 0 };
    await setStorageLocal(DAILY_STATS_KEY, reset);
    return reset;
  }
  return stored;
}

export async function bumpDailyStats(isBlocked: boolean): Promise<DailyStats> {
  const current = await loadDailyStats();
  const updated: DailyStats = {
    ...current,
    processedAlerts: current.processedAlerts + 1,
    blockedAlerts: current.blockedAlerts + (isBlocked ? 1 : 0),
  };
  await setStorageLocal(DAILY_STATS_KEY, updated);
  return updated;
}

export async function saveLatestContext(value: unknown): Promise<void> {
  await setStorageLocal(LATEST_CONTEXT_KEY, value);
}

export async function saveLatestAnalysis(value: unknown): Promise<void> {
  await setStorageLocal(LATEST_ANALYSIS_KEY, value);
}

export async function loadLatestPanelData(): Promise<{ context?: unknown; analysis?: unknown }> {
  const [context, analysis] = await Promise.all([
    getStorageLocal<unknown>(LATEST_CONTEXT_KEY),
    getStorageLocal<unknown>(LATEST_ANALYSIS_KEY),
  ]);
  return { context, analysis };
}
