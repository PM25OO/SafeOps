import { ParsedAlertContext, ParserRules } from "../api/protocol";

const ALERT_ID_SELECTORS = ["[data-alert-id]", "#alert-id", ".alert-id"];
const TITLE_SELECTORS = ["h1", "[data-alert-title]", ".alert-title"];
const SEVERITY_SELECTORS = ["[data-severity]", ".severity", "#severity"];
const SOURCE_IP_SELECTORS = ["[data-source-ip]", ".source-ip", "#source-ip"];
const ASSET_SELECTORS = ["[data-asset]", ".asset", "#asset"];
const USER_SELECTORS = ["[data-user]", ".user", "#user", ".username", "#username"];
const TIMESTAMP_SELECTORS = ["time", "[data-timestamp]", ".timestamp"];

function getTextBySelectors(document: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    let candidate = element?.getAttribute("content") ?? element?.textContent;
    if ((!candidate || candidate.trim().length === 0) && element) {
      const dataAttribute = Array.from(element.attributes)
        .find((attr) => attr.name.startsWith("data-"))
        ?.value;
      candidate = dataAttribute;
    }
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return undefined;
}

function normalizeSeverity(value?: string): ParsedAlertContext["severity"] {
  const normalized = (value ?? "low").toLowerCase();
  if (["critical", "high", "medium", "low"].includes(normalized)) {
    return normalized as ParsedAlertContext["severity"];
  }
  return "low";
}

export function parseAlertContext(document: Document, rules?: ParserRules): ParsedAlertContext {
  const alertIdSelectors = rules?.alertId?.length ? rules.alertId : ALERT_ID_SELECTORS;
  const titleSelectors = rules?.title?.length ? rules.title : TITLE_SELECTORS;
  const severitySelectors = rules?.severity?.length ? rules.severity : SEVERITY_SELECTORS;
  const sourceIpSelectors = rules?.sourceIp?.length ? rules.sourceIp : SOURCE_IP_SELECTORS;
  const assetSelectors = rules?.asset?.length ? rules.asset : ASSET_SELECTORS;
  const userSelectors = rules?.user?.length ? rules.user : USER_SELECTORS;
  const timestampSelectors = rules?.timestamp?.length ? rules.timestamp : TIMESTAMP_SELECTORS;

  const alertId =
    getTextBySelectors(document, alertIdSelectors) ??
    `unknown-${Date.now().toString(36)}`;

  const title = getTextBySelectors(document, titleSelectors);
  const severityRaw = getTextBySelectors(document, severitySelectors);

  return {
    alertId,
    title,
    severity: normalizeSeverity(severityRaw),
    sourceIp: getTextBySelectors(document, sourceIpSelectors),
    asset: getTextBySelectors(document, assetSelectors),
    user: getTextBySelectors(document, userSelectors),
    timestamp: getTextBySelectors(document, timestampSelectors),
    rawText: (document.body?.innerText ?? "").slice(0, 4000),
  };
}
