import { parseAlertContext } from "./parser/dom-parser";
import { AnalyzeResultView, ExtensionMessage, ParsedAlertContext, PluginSettings } from "./api/protocol";
import { getStorageLocal, loadSettings, saveLatestContext, setStorageLocal } from "./state/settings";

const BALL_ID = "safeops-floating-ball";
const SAFEOPS_STYLE_ID = "safeops-floating-style";
const BALL_LOGO_CLASS = "safeops-ball-logo";
const BALL_POSITION_KEY = "safeopsFloatingBallPosition";
const BALL_SIZE = 30;
const BALL_EDGE_GAP = 10;
const DRAG_THRESHOLD = 4;
const HIGH_RISK_KEYWORDS = ["ransomware", "exfiltration", "c2", "malware", "bruteforce", "botnet"];
const BALL_LOGO_SVG = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 50 50" enable-background="new 0 0 50 50" xml:space="preserve" height="100%" preserveAspectRatio="xMidYMid meet"><path fill="#FAFAFA" opacity="1.000000" stroke="none" d="M37.017303,51.000000 C24.681440,51.000000 12.848447,51.000000 1.011590,51.000000 C1.007726,34.338966 1.007726,17.677925 1.003861,1.012665 C17.660557,1.008443 34.321121,1.008443 50.986259,1.004219 C50.990841,17.660078 50.990841,34.320164 50.990841,51.000000 C46.506737,51.000000 42.013454,51.000000 37.017303,51.000000 M26.397673,2.143962 C20.044712,4.354548 13.691751,6.565133 6.956484,8.908746 C6.956484,13.332345 7.225052,18.160713 6.904999,22.949745 C6.023767,36.135845 14.045857,43.292900 24.195997,49.076584 C24.960323,49.512108 26.238625,49.898746 26.884794,49.559395 C35.357548,45.109715 43.110481,39.490654 44.715523,29.455956 C45.823872,22.526590 44.928406,15.276717 44.928406,8.911549 C38.571678,6.629993 32.818527,4.565075 26.397673,2.143962 z"></path><path fill="#102D42" opacity="1.000000" stroke="none" d="M26.731525,2.322060 C32.818527,4.565075 38.571678,6.629993 44.928406,8.911549 C44.928406,15.276717 45.823872,22.526590 44.715523,29.455956 C43.110481,39.490654 35.357548,45.109715 26.884794,49.559395 C26.238625,49.898746 24.960323,49.512108 24.195997,49.076584 C14.045857,43.292900 6.023767,36.135845 6.904999,22.949745 C7.225052,18.160713 6.956484,13.332345 6.956484,8.908746 C13.691751,6.565133 20.044712,4.354548 26.731525,2.322060 M22.520973,16.107506 C21.699078,16.507143 20.421419,16.698141 20.127771,17.339602 C17.885742,22.237211 15.835588,27.222656 13.263151,33.267849 C17.229074,31.595577 20.042536,29.500605 22.870453,29.480904 C25.521763,29.462431 28.188370,31.639935 31.965178,33.359692 C30.200567,29.069221 29.177601,26.086275 27.767025,23.299522 C26.498285,20.792984 24.804207,18.501736 22.520973,16.107506 M33.034435,22.611073 C33.036251,25.093117 32.861759,27.594242 33.127258,30.047752 C33.232433,31.019699 34.315113,31.885870 34.952728,32.800201 C35.649834,31.956709 36.911182,31.138060 36.949604,30.265564 C37.151447,25.681629 37.044044,21.084078 37.044044,16.356573 C31.387424,15.552015 33.602341,19.549152 33.034435,22.611073 z"></path><path fill="#E4E7E9" opacity="1.000000" stroke="none" d="M22.909359,16.111515 C24.804207,18.501736 26.498285,20.792984 27.767025,23.299522 C29.177601,26.086275 30.200567,29.069221 31.965178,33.359692 C28.188370,31.639935 25.521763,29.462431 22.870453,29.480904 C20.042536,29.500605 17.229074,31.595577 13.263151,33.267849 C15.835588,27.222656 17.885742,22.237211 20.127771,17.339602 C20.421419,16.698141 21.699078,16.507143 22.909359,16.111515 z"></path><path fill="#E4E7E9" opacity="1.000000" stroke="none" d="M33.034325,22.141592 C33.602341,19.549152 31.387424,15.552015 37.044044,16.356573 C37.044044,21.084078 37.151447,25.681629 36.949604,30.265564 C36.911182,31.138060 35.649834,31.956709 34.952728,32.800201 C34.315113,31.885870 33.232433,31.019699 33.127258,30.047752 C32.861759,27.594242 33.036251,25.093117 33.034325,22.141592 z"></path></svg>`;

type BallVisualState = "listening" | "alert" | "disabled";

interface BallPosition {
  side: "left" | "right";
  top: number;
}

function ensureStyle(): void {
  if (document.getElementById(SAFEOPS_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = SAFEOPS_STYLE_ID;
  style.textContent = `
    #${BALL_ID} {
      position: fixed;
      right: ${BALL_EDGE_GAP}px;
      top: 45%;
      width: ${BALL_SIZE}px;
      height: ${BALL_SIZE}px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2147483647;
      opacity: 0.92;
      transition: opacity .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease, left .2s ease, right .2s ease, top .2s ease;
      user-select: none;
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.24);
    }

    #${BALL_ID} .${BALL_LOGO_CLASS} {
      width: 20px;
      height: 20px;
      display: block;
      pointer-events: none;
    }

    #${BALL_ID}:hover {
      opacity: 1;
      border-color: rgba(59, 130, 246, 0.6);
      background: #f8fbff;
    }

    #${BALL_ID}.safeops-listening {
      box-shadow:
        0 0 0 2px rgba(59, 130, 246, 0.26),
        0 0 14px rgba(59, 130, 246, 0.72),
        0 6px 14px rgba(15, 23, 42, 0.2);
      animation: safeops-listening-glow 1.8s ease-in-out infinite;
    }

    #${BALL_ID}.safeops-alert {
      border-color: rgba(248, 113, 113, 0.95);
      animation: safeops-alert-pulse 1.3s ease-in-out infinite;
      box-shadow:
        0 0 0 2px rgba(248, 113, 113, 0.3),
        0 0 16px rgba(239, 68, 68, 0.66),
        0 6px 14px rgba(127, 29, 29, 0.35);
    }

    #${BALL_ID}.safeops-disabled {
      opacity: 0.6;
      border-style: dashed;
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.25);
      filter: grayscale(0.4);
    }

    #${BALL_ID}.dragging {
      transition: none;
      cursor: grabbing;
    }

    @keyframes safeops-listening-glow {
      0%, 100% {
        box-shadow:
          0 0 0 2px rgba(59, 130, 246, 0.22),
          0 0 11px rgba(59, 130, 246, 0.54),
          0 6px 14px rgba(15, 23, 42, 0.2);
      }
      50% {
        box-shadow:
          0 0 0 2px rgba(59, 130, 246, 0.35),
          0 0 16px rgba(59, 130, 246, 0.82),
          0 6px 14px rgba(15, 23, 42, 0.25);
      }
    }

    @keyframes safeops-alert-pulse {
      0% {
        box-shadow:
          0 0 0 0 rgba(248, 113, 113, 0.46),
          0 0 14px rgba(239, 68, 68, 0.62),
          0 6px 14px rgba(127, 29, 29, 0.35);
      }
      70% {
        box-shadow:
          0 0 0 8px rgba(248, 113, 113, 0),
          0 0 18px rgba(239, 68, 68, 0.52),
          0 6px 14px rgba(127, 29, 29, 0.35);
      }
      100% {
        box-shadow:
          0 0 0 0 rgba(248, 113, 113, 0),
          0 0 14px rgba(239, 68, 68, 0.62),
          0 6px 14px rgba(127, 29, 29, 0.35);
      }
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

function isContextInvalidatedError(error: unknown): boolean {
  return error instanceof Error && /Extension context invalidated/i.test(error.message);
}

function normalizeDecisionSummary(summary: string): string {
  const normalizedLines = summary
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (normalizedLines.length === 0) {
    return "";
  }

  const uniqueLines: string[] = [];
  for (const line of normalizedLines) {
    if (!uniqueLines.some((existing) => existing.toLowerCase() === line.toLowerCase())) {
      uniqueLines.push(line);
    }
  }

  if (uniqueLines.length === 1) {
    return uniqueLines[0];
  }

  return uniqueLines.join(" ");
}

function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.id) {
      reject(new Error("Extension context invalidated."));
      return;
    }

    try {
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
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Unknown extension error"));
    }
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
  const svgDoc = new DOMParser().parseFromString(BALL_LOGO_SVG, "image/svg+xml");
  const svgElement = svgDoc.documentElement;
  svgElement.classList.add(BALL_LOGO_CLASS);
  svgElement.setAttribute("aria-hidden", "true");
  svgElement.setAttribute("focusable", "false");
  ball.appendChild(document.importNode(svgElement, true));
  ball.title = "SafeOps 悬浮球（单击切换监听）";
  document.documentElement.appendChild(ball);
  return ball;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeTop(top: number): number {
  return clamp(top, BALL_EDGE_GAP, Math.max(BALL_EDGE_GAP, window.innerHeight - BALL_SIZE - BALL_EDGE_GAP));
}

async function restoreBallPosition(ball: HTMLDivElement): Promise<void> {
  const stored = await getStorageLocal<BallPosition>(BALL_POSITION_KEY);
  if (!stored) {
    return;
  }

  ball.style.top = `${normalizeTop(stored.top)}px`;
  ball.style.left = stored.side === "left" ? `${BALL_EDGE_GAP}px` : "auto";
  ball.style.right = stored.side === "right" ? `${BALL_EDGE_GAP}px` : "auto";
}

function snapToEdge(ball: HTMLDivElement): void {
  const rect = ball.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const side: BallPosition["side"] = centerX < window.innerWidth / 2 ? "left" : "right";
  const top = normalizeTop(rect.top);

  ball.style.top = `${top}px`;
  if (side === "left") {
    ball.style.left = `${BALL_EDGE_GAP}px`;
    ball.style.right = "auto";
  } else {
    ball.style.right = `${BALL_EDGE_GAP}px`;
    ball.style.left = "auto";
  }

  void setStorageLocal<BallPosition>(BALL_POSITION_KEY, { side, top });
}

function enableDrag(ball: HTMLDivElement): void {
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let pointerDown = false;
  let moved = false;

  ball.addEventListener("mousedown", (event) => {
    pointerDown = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;

    const rect = ball.getBoundingClientRect();
    offsetX = startX - rect.left;
    offsetY = startY - rect.top;

    if (!ball.style.left || ball.style.left === "auto") {
      ball.style.left = `${rect.left}px`;
      ball.style.right = "auto";
    }

    ball.classList.add("dragging");
    ball.style.right = "auto";
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!pointerDown) {
      return;
    }

    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);
    if (dx + dy > DRAG_THRESHOLD) {
      moved = true;
    }

    const left = clamp(event.clientX - offsetX, 0, Math.max(0, window.innerWidth - BALL_SIZE));
    const top = clamp(event.clientY - offsetY, 0, Math.max(0, window.innerHeight - BALL_SIZE));
    ball.style.left = `${left}px`;
    ball.style.top = `${top}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!pointerDown) {
      return;
    }

    pointerDown = false;
    ball.classList.remove("dragging");
    if (moved) {
      snapToEdge(ball);
      ball.dataset.dragged = "1";
      window.setTimeout(() => {
        ball.dataset.dragged = "0";
      }, 0);
      return;
    }

    ball.dataset.dragged = "0";
  });

  ball.addEventListener(
    "click",
    (event) => {
      if (ball.dataset.dragged === "1") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
}

function updateBallState(ball: HTMLDivElement, state: BallVisualState): void {
  ball.classList.remove("safeops-listening", "safeops-alert", "safeops-disabled");
  if (state === "disabled") {
    ball.classList.add("safeops-disabled");
    ball.title = "SafeOps 监听已关闭（单击开启）";
    return;
  }

  if (state === "alert") {
    ball.classList.add("safeops-alert");
    ball.title = "SafeOps 监听中（高风险）｜单击关闭";
    return;
  }

  ball.classList.add("safeops-listening");
  ball.title = "SafeOps 监听中（单击关闭）";
}

async function analyzeAndApplyState(ball: HTMLDivElement, settings: PluginSettings, context: ParsedAlertContext): Promise<void> {
  if (!settings.pluginEnabled) {
    updateBallState(ball, "disabled");
    return;
  }

  updateBallState(ball, shouldHighlight(context) ? "alert" : "listening");

  const result = await analyzeIfEnabled(context);
  if (result?.recommendation === "block_and_isolate") {
    updateBallState(ball, "alert");
  }

  if (result?.ai_decision?.summary) {
    const normalizedSummary = normalizeDecisionSummary(result.ai_decision.summary);
    if (normalizedSummary) {
      ball.title = `${ball.title}\n${normalizedSummary}`;
    }
  }
}

async function toggleMonitoring(ball: HTMLDivElement, context: ParsedAlertContext): Promise<void> {
  try {
    const current = await loadSettings();
    const updated = await sendMessage<PluginSettings>({
      type: "UPDATE_SETTINGS",
      payload: { pluginEnabled: !current.pluginEnabled },
      traceId: crypto.randomUUID(),
    });

    await analyzeAndApplyState(ball, updated, context);
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      updateBallState(ball, "disabled");
      ball.title = "SafeOps 扩展已更新，请刷新当前页面后继续使用";
      return;
    }

    console.warn("[SafeOps] Toggle monitoring failed:", error);
    ball.title = "SafeOps 监听切换失败，请稍后重试";
  }
}

function bindStorageSync(ball: HTMLDivElement, context: ParsedAlertContext): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes.pluginSettings) {
      return;
    }

    void (async () => {
      const latest = await loadSettings();
      await analyzeAndApplyState(ball, latest, context);
    })();
  });
}

function bindSingleClickToggle(ball: HTMLDivElement, context: ParsedAlertContext): void {
  ball.addEventListener("click", (event) => {
    if (event.defaultPrevented) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    void toggleMonitoring(ball, context);
  });
}

async function analyzeIfEnabled(context: ParsedAlertContext): Promise<AnalyzeResultView | null> {
  try {
    return await sendMessage<AnalyzeResultView>({
      type: "ANALYZE_ALERT",
      payload: context,
      traceId: crypto.randomUUID(),
    });
  } catch (error) {
    if (!isContextInvalidatedError(error)) {
      console.warn("[SafeOps] Analyze failed:", error);
    }
    return null;
  }
}

async function bootstrap(): Promise<void> {
  const settings = await loadSettings();
  const context = parseAlertContext(document, settings.parserRules);
  await saveLatestContext(context);

  const ball = ensureFloatingBall();
  await restoreBallPosition(ball);
  enableDrag(ball);
  bindSingleClickToggle(ball, context);
  bindStorageSync(ball, context);
  window.addEventListener("resize", () => snapToEdge(ball));

  await analyzeAndApplyState(ball, settings, context);
}

window.addEventListener("load", () => {
  void bootstrap();
});
