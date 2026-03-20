import { ExtensionMessage, RouterResponse } from "./protocol";

export type MessageHandler = (
  message: ExtensionMessage,
  sender?: chrome.runtime.MessageSender,
) => Promise<unknown> | unknown;

export class MessageRouter {
  private handlers = new Map<string, MessageHandler>();

  register(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  async handle(
    message: ExtensionMessage,
    sender?: chrome.runtime.MessageSender,
  ): Promise<RouterResponse> {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      return {
        ok: false,
        error: `No handler registered for type: ${message.type}`,
      };
    }

    try {
      const data = await handler(message, sender);
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown handler error",
      };
    }
  }
}
