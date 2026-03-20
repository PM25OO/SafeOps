import { ExtensionMessage } from "./api/protocol";

interface AuditEvent {
  timestamp?: string;
  alert_id?: string;
  risk_score?: number;
  recommendation?: string;
  audit_id?: string;
}

function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "Unknown extension error"));
        return;
      }
      resolve(response.data as T);
    });
  });
}

function renderRows(items: AuditEvent[]): void {
  const tbody = document.getElementById("audit-tbody") as HTMLTableSectionElement;
  const empty = document.getElementById("audit-empty") as HTMLParagraphElement;

  tbody.innerHTML = "";

  if (items.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  for (const item of items) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.timestamp ?? "-"}</td>
      <td>${item.alert_id ?? "-"}</td>
      <td>${item.risk_score ?? "-"}</td>
      <td>${item.recommendation ?? "-"}</td>
      <td>${item.audit_id ?? "-"}</td>
    `;
    tbody.appendChild(row);
  }
}

async function refreshAudit(): Promise<void> {
  const result = await sendMessage<{ items: AuditEvent[] }>({ type: "GET_AUDIT_LOGS" });
  renderRows(result.items ?? []);
}

async function initAudit(): Promise<void> {
  const refreshBtn = document.getElementById("refresh-audit") as HTMLButtonElement;
  refreshBtn.addEventListener("click", () => {
    void refreshAudit();
  });

  await refreshAudit();
}

void initAudit();
