export type MessageType = "PING" | "PARSE_DOM" | "ANALYZE_ALERT" | "ANALYZE_RESULT";

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
