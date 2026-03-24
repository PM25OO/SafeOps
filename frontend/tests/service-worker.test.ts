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

  beforeEach(async () => {
    jest.resetModules();
    onMessageListener = undefined;

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

    const storageArea = {
      get: jest.fn((_keys: string[], callback: (value: Record<string, unknown>) => void) => callback({})),
      set: jest.fn((_value: Record<string, unknown>, callback: () => void) => callback()),
    };

    (globalThis as unknown as { chrome: typeof chrome }).chrome = {
      runtime,
      sidePanel,
      storage: {
        sync: storageArea,
        local: storageArea,
        managed: storageArea,
        session: storageArea,
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
          hasListener: jest.fn(),
          hasListeners: jest.fn(),
        },
      },
    } as unknown as typeof chrome;

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
});
