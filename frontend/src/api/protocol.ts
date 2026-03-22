export type MessageType =
  | "PING"
  | "PARSE_DOM"
  | "ANALYZE_ALERT"
  | "ANALYZE_RESULT"
  | "OPEN_SIDE_PANEL"
  | "LOAD_SETTINGS"
  | "GET_DEFAULT_SETTINGS"
  | "UPDATE_SETTINGS"
  | "GET_POPUP_DASHBOARD"
  | "TEST_BACKEND_CONNECTION"
  | "GET_AUDIT_LOGS"
  | "EXECUTE_ACTION";

export type Recommendation = "monitor" | "manual_review" | "block_and_isolate";

export type ActionId =
  | "query_asset"
  | "watch_alert"
  | "collect_forensics"
  | "create_incident_ticket"
  | "block_ip"
  | "isolate_host"
  | "auto_restart_server";

export interface ParserRules {
  alertId?: string[];
  title?: string[];
  severity?: string[];
  sourceIp?: string[];
  asset?: string[];
  user?: string[];
  timestamp?: string[];
}

export interface AllowlistConfig {
  query_asset: boolean;
  watch_alert: boolean;
  collect_forensics: boolean;
  create_incident_ticket: boolean;
  block_ip: boolean;
  isolate_host: boolean;
  auto_restart_server: boolean;
}

export interface PluginSettings {
  pluginEnabled: boolean;
  backendBaseUrl: string;
  allowlist: AllowlistConfig;
  parserRules: ParserRules;
}

export interface DailyStats {
  date: string;
  processedAlerts: number;
  blockedAlerts: number;
}

export interface ParsedAlertContext {
  alertId: string;
  title?: string;
  severity: "low" | "medium" | "high" | "critical";
  sourceIp?: string;
  asset?: string;
  user?: string;
  timestamp?: string;
  rawText: string;
}

export interface AnalyzeResultView {
  matched_rules?: Array<{
    rule_id: string;
    rule_name: string;
    score: number;
    reason: string;
  }>;
  risk_score?: number;
  recommendation?: Recommendation;
  suggested_actions?: ActionId[];
  audit_id?: string;
  ai_decision?: {
    summary?: string;
    confidence?: number;
    suggested_action?: Recommendation;
    reasoning?: string;
  };
  policy_decision?: {
    policy_id?: string;
    allow_execute?: boolean;
    requires_human_confirm?: boolean;
    reason?: string;
  };
}

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
  traceId?: string;
}

export interface RouterResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
