import { MessageRouter } from "./api/message-router";
import { ExtensionMessage, ParsedAlertContext } from "./api/protocol";

const router = new MessageRouter();
const DEFAULT_BACKEND_URL = "http://localhost:8000";

async function getBackendBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["backendBaseUrl"], (result) => {
      resolve(result.backendBaseUrl ?? DEFAULT_BACKEND_URL);
    });
  });
}

router.register("PING", () => ({ status: "alive" }));

router.register("ANALYZE_ALERT", async (message: ExtensionMessage) => {
  const payload = (message.payload ?? {}) as ParsedAlertContext;
  const backendBaseUrl = await getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  return response.json();
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  router
    .handle(message)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown error" });
    });

  return true;
});
