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

export interface PushProvider {
  send(input: PushMessage): Promise<void>;
}

/** Expo Push API - swappable later. */
export class ExpoPushProvider implements PushProvider {
  async send(input: PushMessage): Promise<void> {
    if (input.tokens.length === 0) return;

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
      }
    } catch (error) {
      console.error("[push]", "ExpoPushError", error);
    }
  }
}

export const pushProvider: PushProvider = new ExpoPushProvider();
