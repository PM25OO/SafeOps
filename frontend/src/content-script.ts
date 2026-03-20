import { parseAlertContext } from "./parser/dom-parser";
import { AnalyzeResultView, ExtensionMessage, ParsedAlertContext } from "./api/protocol";
import { loadSettings, saveLatestContext } from "./state/settings";

const BALL_ID = "safeops-floating-ball";
const SAFEOPS_STYLE_ID = "safeops-floating-style";
const HIGH_RISK_KEYWORDS = ["ransomware", "exfiltration", "c2", "malware", "bruteforce", "botnet"];

function ensureStyle(): void {
  if (document.getElementById(SAFEOPS_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = SAFEOPS_STYLE_ID;
  style.textContent = `
    #${BALL_ID} {
      position: fixed;
      right: -18px;
      top: 45%;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 2px solid rgba(148, 163, 184, 0.65);
      color: #e2e8f0;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2147483647;
      opacity: 0.45;
      transition: opacity .2s ease, right .2s ease, box-shadow .2s ease, transform .2s ease;
      user-select: none;
      box-shadow: 0 6px 20px rgba(15, 23, 42, .35);
    }
    #${BALL_ID}:hover {
      right: 8px;
      opacity: 0.95;
      transform: scale(1.05);
    }
    #${BALL_ID}.safeops-alert {
      right: 8px;
      opacity: 0.95;
      border-color: rgba(248, 113, 113, 0.9);
      background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%);
      animation: safeops-breath 1.6s ease-in-out infinite;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
    }
    #${BALL_ID}.safeops-disabled {
      opacity: 0.35;
      border-style: dashed;
      background: linear-gradient(135deg, #0f172a 0%, #111827 100%);
    }
    @keyframes safeops-breath {
      0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.6); }
      70% { box-shadow: 0 0 0 12px rgba(248, 113, 113, 0); }
      100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
    }
  `;
  document.documentElement.appendChild(style);
}

function shouldHighlight(context: ParsedAlertContext): boolean {
  if (context.severity === "critical" || context.severity === "high") {
    return true;
  }

  const text = `${context.title ?? ""} ${context.rawText}`.toLowerCase();
  return HIGH_RISK_KEYWORDS.some((keyword) => text.includes(keyword));
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

function ensureFloatingBall(): HTMLDivElement {
  ensureStyle();
  let ball = document.getElementById(BALL_ID) as HTMLDivElement | null;
  if (ball) {
    return ball;
  }

  ball = document.createElement("div");
  ball.id = BALL_ID;
  ball.textContent = "AI";
  ball.title = "SafeOps AI 悬浮控制台";
  document.documentElement.appendChild(ball);
  return ball;
}

function enableDrag(ball: HTMLDivElement): void {
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  ball.addEventListener("mousedown", (event) => {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    const rect = ball.getBoundingClientRect();
    offsetX = startX - rect.left;
    offsetY = startY - rect.top;
    ball.style.right = "auto";
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!dragging) {
      return;
    }
    const left = event.clientX - offsetX;
    const top = event.clientY - offsetY;
    ball.style.left = `${Math.max(0, left)}px`;
    ball.style.top = `${Math.max(0, top)}px`;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  ball.addEventListener("click", (event) => {
    const moved = Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) > 4;
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

function updateBallState(ball: HTMLDivElement, state: "idle" | "alert" | "disabled"): void {
  ball.classList.remove("safeops-alert", "safeops-disabled");
  if (state === "alert") {
    ball.classList.add("safeops-alert");
    ball.textContent = "!";
    return;
  }
  if (state === "disabled") {
    ball.classList.add("safeops-disabled");
    ball.textContent = "OFF";
    return;
  }
  ball.textContent = "AI";
}

async function analyzeIfEnabled(context: ParsedAlertContext): Promise<AnalyzeResultView | null> {
  try {
    return await sendMessage<AnalyzeResultView>({
      type: "ANALYZE_ALERT",
      payload: context,
      traceId: crypto.randomUUID(),
    });
  } catch (error) {
    console.warn("[SafeOps] Analyze failed:", error);
    return null;
  }
}

async function openSidePanel(context: ParsedAlertContext): Promise<void> {
  try {
    await sendMessage<{ opened: boolean }>({
      type: "OPEN_SIDE_PANEL",
      payload: { context },
      traceId: crypto.randomUUID(),
    });
  } catch (error) {
    console.warn("[SafeOps] Open side panel failed:", error);
  }
}

async function bootstrap(): Promise<void> {
  const settings = await loadSettings();
  const context = parseAlertContext(document, settings.parserRules);
  await saveLatestContext(context);

  const ball = ensureFloatingBall();
  enableDrag(ball);

  if (!settings.pluginEnabled) {
    updateBallState(ball, "disabled");
    ball.title = "SafeOps AI 已禁用（可在Popup中开启）";
  } else {
    const isRisky = shouldHighlight(context);
    updateBallState(ball, isRisky ? "alert" : "idle");
    const result = await analyzeIfEnabled(context);
    if (result?.recommendation === "block_and_isolate") {
      updateBallState(ball, "alert");
    }
    ball.title = result?.ai_decision?.summary ?? "SafeOps AI 已完成页面研判";
  }

  ball.addEventListener("dblclick", (event) => {
    event.preventDefault();
    void openSidePanel(context);
  });

  ball.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    void openSidePanel(context);
  });

  ball.addEventListener("click", (event) => {
    if (event.detail === 1) {
      setTimeout(() => {
        if (event.defaultPrevented) {
          return;
        }
        void openSidePanel(context);
      }, 0);
    }
  });
}

window.addEventListener("load", () => {
  void bootstrap();
});
