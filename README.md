# FlowSell Connect SDK

[![npm version](https://img.shields.io/npm/v/@flowsell/connect.svg)](https://www.npmjs.com/package/@flowsell/connect)
[![license](https://img.shields.io/npm/l/@flowsell/connect.svg)](./LICENSE)

Official JavaScript and TypeScript SDK for FlowSell Connect unified communication APIs.

## Install

```bash
npm install @flowsell/connect
```

## Configure

```bash
FLOWSELL_API_KEY=fsc_your_secret
FLOWSELL_API_BASE_URL=https://cmwhd2hdarqpip3krnua6ep3le0qhstm.lambda-url.ap-south-1.on.aws
```

## Usage

```ts
import { FlowSell } from "@flowsell/connect";

const client = new FlowSell({
  apiKey: process.env.FLOWSELL_API_KEY!,
  baseUrl: process.env.FLOWSELL_API_BASE_URL,
});

const result = await client.messages.send({
  channel: "whatsapp",
  to: "+919999999999",
  message: "Hello from FlowSell Connect SDK",
});

console.log(result);
```

## Template Messages

Create templates with named variables. FlowSell extracts and maps provider variables internally.

```ts
await client.templates.create({
  channel: "whatsapp",
  name: "order_update",
  category: "UTILITY",
  content: `Hello {{customer_name}}
Your order {{order_id}} has shipped.`,
  sampleVariables: {
    customer_name: "John",
    order_id: "#1234",
  },
});
```

Send templates without knowing provider component ordering.

```ts
const template = await client.templates.get("order_update");
console.log(template);

await client.messages.sendTemplate({
  channel: "whatsapp",
  to: "+919999999999",
  template: "order_update",
  variables: {
    customer_name: "John",
    order_id: "#1234",
  },
});
```

FlowSell Connect builds provider-specific payloads internally. SDK examples should not require Graph URLs, WABA IDs, phone-number IDs, access tokens, or raw provider payloads.

## Advanced Templates

URL buttons:

```ts
await client.templates.create({
  channel: "whatsapp",
  name: "track_order",
  category: "UTILITY",
  content: `Hello {{customer_name}}
Your order {{order_id}} has shipped.
Track your order using the button below.`,
  buttons: [
    {
      type: "url",
      text: "Track Order",
      url: "https://track.example.com/{{tracking_id}}",
    },
  ],
  sampleVariables: {
    customer_name: "John",
    order_id: "#1234",
    tracking_id: "1234",
  },
});
```

Quick replies:

```ts
await client.templates.create({
  channel: "whatsapp",
  name: "feedback_request",
  category: "UTILITY",
  content: `Hello {{customer_name}}
Was your experience satisfactory?`,
  buttons: [
    { type: "reply", text: "Yes" },
    { type: "reply", text: "No" },
  ],
});
```

The SDK input shape is the same contract as the REST FlowSell Request Body in the docs.

## Usage

```ts
const usage = await client.usage.get();
console.log(usage.remaining);
```

## Examples

Run the mocked smoke test:

```bash
node examples/mock-smoke-test.mjs
```

Run against your FlowSell Connect workspace:

```bash
FLOWSELL_API_KEY=fsc_your_secret node examples/real-usage.mjs
```

The package uses the `x-api-key` header. Keep API key secrets in server-side environment variables.
