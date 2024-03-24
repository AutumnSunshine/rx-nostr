# Overview

rx-nostr is a library that allows [Nostr](https://nostr.com/) applications to easily and intuitively communicate robustly with one or more relays. rx-nostr is implemented in [RxJS](https://rxjs.dev/) and is designed to enable seamless integration with RxJS features, although using with RxJS is not mandatory.

Using rx-nostr, Nostr app developers can use publish/subscribe as described in [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) , without worrying about the underlying complexities of relay communication.

- **Managing REQ subscriptions**:
  - A high level interface abstarcting Low-level operations required for managing REQ subscriptions such as establishing a REQ, sending CLOSE, handling CLOSED messages
- **WebSocket Reconnection**:
  - Automatically reconnects the WebSocket transmission path based on the backoff strategy & also reconfigures REQ subscriptions that were lost when disconnected.
- **WebSocket Deferment & Idling**:
  - Defer WebSocket connections with relays until they are needed, and automatically disconnect when they are no longer in use. This behavior can also be disabled in settings.
- **WebSocket Connection Monitoring**:
  - Monitor the status of your WebSocket connections. Apps can use this to build interfaces that notify users of the connection status with different relays.
- **RelayPool Management**:
  - Manage collections of relays, handling changes in relay configuration, such as adding or removing default relays or changing Read/Write settings, and appropriately reconfigures currently active REQs under the new relay configuration.
- **Flexible handling of relay-server constraints**
  - Queue REQ requests appropriately, to avoid violating concurrent REQ subscription limit for relays published based on [NIP-11](https://github.com/nostr-protocol/nips/blob/master/11.md) .
- **Handling AUTH requests**
  - Automatically handles AUTH messages based on [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) . When using rx-nostr, all that is needed is to set an option to support NIP-42.
- **Sign and verify signatures**
  - Automatically sign and verify signatures. The only information an app developer needs to provide when publishing an event is the essential content of the event.

Using rx-nostr, for example, the code to subscribe to kind1 events can be easily implemented as shown below. This code is explained in detail in [Getting Started](./getting-started.md).


```js
import { createRxNostr, createRxForwardReq } from "rx-nostr";

const rxNostr = createRxNostr();
rxNostr.setDefaultRelays(["wss://nostr.example.com"]);

const rxReq = createRxForwardReq();

rxNostr.use(rxReq).subscribe((packet) => {
  console.log(packet);
});

rxReq.emit({ kinds: [1] });
```

::: tip Note
This document assumes a basic understanding of NIPs, especially NIP-01. If you are not familiar with those, we recommend that you first read the materials listed below.
- [NIP-01 (EN)](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-01 (JA)](https://github.com/nostr-jp/nips-ja/blob/main/01.md)

:::
