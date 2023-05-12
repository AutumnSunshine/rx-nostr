import { WS } from "jest-websocket-mock";

import { Nostr } from "../nostr/primitive";

const FAKE_EVENTS_INTERVAL = 100;

export function createMockRelay(url: string) {
  const server = new WS(url);
  const provider = new FakeEventProvider();

  server.on("connection", (ws) => {
    ws.on("message", function incoming(rawMessage) {
      if (typeof rawMessage !== "string") {
        throw new Error("Unexpected type message");
      }

      const message: Nostr.OutgoingMessage.Any = JSON.parse(rawMessage);
      const type = message[0];

      if (type === "REQ") {
        const [, subId, ...filters] = message;
        provider.start(ws.url, subId, filters, (event) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(event));
          }
        });
      }
      if (type === "CLOSE") {
        const subId = message[1];
        provider.stop(ws.url, subId);
      }
    });

    ws.on("close", () => {
      provider.stop(ws.url);
    });

    ws.on("error", () => {
      provider.stop(ws.url);
    });
  });

  return server;
}

class FakeEventProvider {
  private subs: Record<string, Record<string, NodeJS.Timeout>> = {};

  start(
    url: string,
    subId: string,
    filters: Nostr.Filter[],
    callback: (
      event: Nostr.IncomingMessage.EVENT | Nostr.IncomingMessage.EOSE
    ) => void
  ): void {
    this.subs[url] ??= {};

    const timeout = this.subs[url][subId];
    if (timeout) {
      clearInterval(timeout);
    }

    for (const ev of generateFakeStoredEvents(subId, filters)) {
      callback(ev);
    }
    callback(["EOSE", subId]);

    this.subs[url][subId] = setTimeout(() => {
      callback(generateFakeEvent(subId));
    }, FAKE_EVENTS_INTERVAL);
  }

  stop(url: string, subId?: string): void {
    const subs = this.subs[url];
    if (subId) {
      const timeout = subs[subId];
      if (timeout) {
        clearInterval(timeout);
      }
      delete subs[subId];
    } else {
      for (const subId of Object.keys(subs)) {
        this.stop(url, subId);
      }
    }
  }
}

function generateFakeStoredEvents(
  subId: string,
  filters: Nostr.Filter[]
): Nostr.IncomingMessage.EVENT[] {
  return filters.flatMap((filter) => {
    const limit = filter.limit;
    if (limit) {
      return Array.from({ length: limit }).map(() => generateFakeEvent(subId));
    } else {
      return [];
    }
  });
}

function generateFakeEvent(
  subId: string
  // NOTE:
  //   Returns a fixed event because currently there is no need
  //   to generate an event according to the Filter.
  // filter: Nostr.Filter
): Nostr.IncomingMessage.EVENT {
  const event: Nostr.Event = {
    id: "*",
    content: "*",
    created_at: new Date("2000/1/1").getTime() / 1000,
    kind: 0,
    pubkey: "*",
    sig: "*",
    tags: [],
  };

  return ["EVENT", subId, event];
}

export async function expectReceiveMessage(
  relay: WS,
  message: Nostr.OutgoingMessage.Any
) {
  await expect(relay).toReceiveMessage(JSON.stringify(message));
}