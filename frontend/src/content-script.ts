import { parseAlertContext } from "./parser/dom-parser";
import { ExtensionMessage } from "./api/protocol";

function buildAnalyzeMessage(): ExtensionMessage {
  const payload = parseAlertContext(document);
  return {
    type: "ANALYZE_ALERT",
    payload,
    traceId: crypto.randomUUID(),
  };
}

function sendForAnalysis(): void {
  const message = buildAnalyzeMessage();
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("[SafeOps] sendMessage failed:", chrome.runtime.lastError.message);
      return;
    }
    console.debug("[SafeOps] analyze response:", response);
  });
}

window.addEventListener("load", () => {
  sendForAnalysis();
});
