import { AllowlistConfig, ParserRules, PluginSettings } from "./api/protocol";

const PARSER_RULE_KEYS = ["alertId", "title", "severity", "sourceIp", "asset", "user", "timestamp"] as const;
const ALLOWLIST_KEYS = [
  "query_asset",
  "watch_alert",
  "collect_forensics",
  "create_incident_ticket",
  "block_ip",
  "isolate_host",
  "auto_restart_server",
] as const;

export function normalizeBackendBaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("后端地址不能为空");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("后端地址格式不正确，请使用 http(s)://host:port");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("后端地址仅支持 http 或 https 协议");
  }

  if (parsed.search || parsed.hash) {
    throw new Error("后端地址不应包含 query/hash 参数");
  }

  const normalizedPath = parsed.pathname.replace(/\/$/, "");
  return `${parsed.origin}${normalizedPath}`;
}

export function normalizeParserRules(input: ParserRules): ParserRules {
  const normalized: ParserRules = {};

  for (const key of PARSER_RULE_KEYS) {
    const value = input[key];
    if (!Array.isArray(value)) {
      continue;
    }
    const deduped = Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
    if (deduped.length > 0) {
      normalized[key] = deduped;
    }
  }

  return normalized;
}

export function parseParserRulesText(text: string): ParserRules {
  if (!text.trim()) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("DOM 解析规则 JSON 无法解析");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("DOM 解析规则必须是 JSON 对象");
  }

  return normalizeParserRules(parsed as ParserRules);
}

function mergeAllowlist(raw: unknown, current: AllowlistConfig): AllowlistConfig {
  const merged: AllowlistConfig = { ...current };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return merged;
  }

  const source = raw as Record<string, unknown>;
  for (const key of ALLOWLIST_KEYS) {
    const value = source[key];
    if (typeof value === "boolean") {
      merged[key] = value;
    }
  }

  return merged;
}

function isParserRulesOnlyObject(raw: Record<string, unknown>): boolean {
  return PARSER_RULE_KEYS.some((key) => key in raw);
}

export function parseImportedOptions(
  text: string,
  currentAllowlist: AllowlistConfig,
): Partial<PluginSettings> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("导入文件不是有效 JSON");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("导入文件必须是 JSON 对象");
  }

  const raw = parsed as Record<string, unknown>;

  if (isParserRulesOnlyObject(raw) && !("parserRules" in raw)) {
    return { parserRules: normalizeParserRules(raw as ParserRules) };
  }

  const result: Partial<PluginSettings> = {};

  if (typeof raw.backendBaseUrl === "string") {
    result.backendBaseUrl = normalizeBackendBaseUrl(raw.backendBaseUrl);
  }

  if (raw.allowlist !== undefined) {
    result.allowlist = mergeAllowlist(raw.allowlist, currentAllowlist);
  }

  if (raw.parserRules !== undefined) {
    if (typeof raw.parserRules !== "object" || raw.parserRules === null || Array.isArray(raw.parserRules)) {
      throw new Error("parserRules 字段必须是 JSON 对象");
    }
    result.parserRules = normalizeParserRules(raw.parserRules as ParserRules);
  }

  if (Object.keys(result).length === 0) {
    throw new Error("未识别到可导入的配置字段");
  }

  return result;
}