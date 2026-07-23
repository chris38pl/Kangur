export type PushMessage = {
  tokens: string[];
  title: string;
  body: string;
  data: {
    notificationId?: string;
    payloadType: string;
    payloadSchemaVersion: number;
    payload: unknown;
  };
};

export type PushSendResult = {
  /** Expo tokens that should be soft-deactivated (DeviceNotRegistered). */
  notRegisteredTokens: string[];
};

export interface PushProvider {
  send(input: PushMessage): Promise<PushSendResult>;
}

type ExpoTicket =
  | { status: "ok"; id: string }
  | {
      status: "error";
      message?: string;
      details?: { error?: string };
    };

type ExpoPushResponse = {
  data?: ExpoTicket[];
};

/** Expo Push API - swappable later. */
export class ExpoPushProvider implements PushProvider {
  async send(input: PushMessage): Promise<PushSendResult> {
    if (input.tokens.length === 0) {
      return { notRegisteredTokens: [] };
    }

    const messages = input.tokens.map((to) => ({
      to,
      title: input.title,
      body: input.body,
      data: input.data,
      sound: "default" as const,
    }));

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        console.error("[push]", "ExpoPushFailed", {
          status: res.status,
          body: await res.text(),
        });
        return { notRegisteredTokens: [] };
      }

      const json = (await res.json()) as ExpoPushResponse;
      const tickets = json.data ?? [];
      const notRegisteredTokens: string[] = [];

      for (let i = 0; i < tickets.length; i += 1) {
        const ticket = tickets[i];
        const token = input.tokens[i];
        if (
          ticket?.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered" &&
          token
        ) {
          notRegisteredTokens.push(token);
        }
      }

      return { notRegisteredTokens };
    } catch (error) {
      console.error("[push]", "ExpoPushError", error);
      return { notRegisteredTokens: [] };
    }
  }
}

export const pushProvider: PushProvider = new ExpoPushProvider();
