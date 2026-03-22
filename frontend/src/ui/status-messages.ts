import { BackendErrorCode } from "../api/protocol";

const BACKEND_ERROR_PATTERN = /(BACKEND_TIMEOUT|BACKEND_NETWORK|BACKEND_HTTP|BACKEND_RESPONSE_PARSE)/;

const BACKEND_ERROR_HINTS: Record<BackendErrorCode, string> = {
  BACKEND_TIMEOUT: "后端响应超时，请稍后重试。",
  BACKEND_NETWORK: "网络异常，请检查后端地址或服务可达性。",
  BACKEND_HTTP: "后端服务返回异常状态，请检查后端日志。",
  BACKEND_RESPONSE_PARSE: "后端返回数据格式异常，请检查接口实现。",
};

function parseBackendErrorCode(message: string): BackendErrorCode | undefined {
  const matched = message.match(BACKEND_ERROR_PATTERN)?.[1];
  if (!matched) {
    return undefined;
  }

  return matched as BackendErrorCode;
}

export function getBackendErrorHint(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const code = parseBackendErrorCode(error.message);
  if (!code) {
    return error.message || fallback;
  }

  return BACKEND_ERROR_HINTS[code] ?? fallback;
}

export function getLlmModeLabel(mode?: string): string | undefined {
  if (mode === "qwen") {
    return "通义千问";
  }

  if (mode === "mock") {
    return "本地模型";
  }

  return undefined;
}
