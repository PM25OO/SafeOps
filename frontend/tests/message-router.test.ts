import { MessageRouter } from "../src/api/message-router";

describe("MessageRouter", () => {
  test("routes message to registered handler", async () => {
    const router = new MessageRouter();
    router.register("PING", () => ({ status: "alive" }));

    const result = await router.handle({ type: "PING" });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ status: "alive" });
  });

  test("returns error for unknown message type", async () => {
    const router = new MessageRouter();

    const result = await router.handle({ type: "ANALYZE_RESULT" });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("No handler registered");
  });
});
