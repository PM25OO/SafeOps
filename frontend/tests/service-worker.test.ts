type RuntimeMessageListener = (
  message: { type: string; payload?: unknown; traceId?: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean;

async function waitForAsyncBridge(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("service-worker message bridge", () => {
  let onMessageListener: RuntimeMessageListener | undefined;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    jest.resetModules();
    onMessageListener = undefined;
    fetchMock = jest.fn();

    const syncStore: Record<string, unknown> = {};
    const localStore: Record<string, unknown> = {};

    const createStorageArea = (store: Record<string, unknown>) => ({
      get: jest.fn((keys: string[], callback: (value: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        keys.forEach((key) => {
          if (key in store) {
            result[key] = store[key];
          }
        });
        callback(result);
      }),
      set: jest.fn((value: Record<string, unknown>, callback: () => void) => {
        Object.assign(store, value);
        callback();
      }),
    });

    const runtime = {
      onInstalled: {
        addListener: jest.fn(),
      },
      onStartup: {
        addListener: jest.fn(),
      },
      onMessage: {
        addListener: jest.fn((listener: RuntimeMessageListener) => {
          onMessageListener = listener;
        }),
      },
    };

    const sidePanel = {
      setOptions: jest.fn().mockResolvedValue(undefined),
      open: jest.fn().mockResolvedValue(undefined),
    };

    const syncStorage = createStorageArea(syncStore);
    const localStorage = createStorageArea(localStore);

    (globalThis as unknown as { chrome: typeof chrome }).chrome = {
      runtime,
      sidePanel,
      storage: {
        sync: syncStorage,
        local: localStorage,
        managed: syncStorage,
        session: localStorage,
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
          hasListener: jest.fn(),
          hasListeners: jest.fn(),
        },
      },
    } as unknown as typeof chrome;

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    await import("../src/service-worker");
  });

  test("responds to router-driven messages", async () => {
    expect(onMessageListener).toBeDefined();

    const sendResponse = jest.fn();
    const keepChannelOpen = onMessageListener?.(
      { type: "PING" },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    expect(keepChannelOpen).toBe(true);
    await waitForAsyncBridge();

    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: { status: "alive" },
    });
  });

  test("responds after opening side panel", async () => {
    expect(onMessageListener).toBeDefined();

    const sendResponse = jest.fn();
    const keepChannelOpen = onMessageListener?.(
      { type: "OPEN_SIDE_PANEL" },
      {
        tab: { id: 7, windowId: 3 } as chrome.tabs.Tab,
      } as chrome.runtime.MessageSender,
      sendResponse,
    );

    expect(keepChannelOpen).toBe(true);
    await waitForAsyncBridge();

    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 3 });
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: { opened: true },
    });
  });

  test("routes ANALYZE_ALERT through router and returns backend result", async () => {
    expect(onMessageListener).toBeDefined();

    const backendResult = {
      risk_score: 91,
      recommendation: "block_and_isolate",
      suggested_actions: ["block_ip", "isolate_host"],
      audit_id: "AUD-TEST-001",
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(backendResult),
    });

    const sendResponse = jest.fn();
    const keepChannelOpen = onMessageListener?.(
      {
        type: "ANALYZE_ALERT",
        payload: {
          alertId: "ALT-SW-001",
          title: "Credential stuffing detected",
          severity: "high",
          sourceIp: "1.2.3.4",
          asset: "prod-web-01",
          user: "admin",
          timestamp: "2026-03-25T10:00:00Z",
          rawText: "High-risk login burst observed.",
        },
      },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    expect(keepChannelOpen).toBe(true);
    await waitForAsyncBridge();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/analyze",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, data: backendResult });
  });

  test("returns normalized backend parse error for ANALYZE_ALERT", async () => {
    expect(onMessageListener).toBeDefined();

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error("invalid json")),
    });

    const sendResponse = jest.fn();
    const keepChannelOpen = onMessageListener?.(
      {
        type: "ANALYZE_ALERT",
        payload: {
          alertId: "ALT-SW-ERR-001",
          severity: "medium",
          rawText: "Parser regression payload",
        },
      },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    expect(keepChannelOpen).toBe(true);
    await waitForAsyncBridge();

    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      error: "Backend response JSON parse failed.",
    });
  });
});
