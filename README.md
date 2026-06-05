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
  phoneNumberId: "1131858666672190",
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
  phoneNumberId: "1131858666672190",
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
  phoneNumberId: "1131858666672190",
  to: "+919999999999",
  template: "order_update",
  variables: {
    customer_name: "John",
    order_id: "#1234",
  },
});
```

FlowSell Connect builds provider-specific payloads internally. SDK examples should not require Graph URLs, WABA IDs, access tokens, or raw provider payloads.

`phoneNumberId` is optional when the workspace has one active number. Pass it when your API key can send from multiple connected WhatsApp numbers.

## Media

Upload media from a public URL, list uploaded media IDs, and reuse them in messages.

```ts
const media = await client.media.upload({
  channel: "whatsapp",
  phoneNumberId: "1131858666672190",
  url: "https://example.com/invoice.pdf",
  filename: "invoice.pdf",
});

const library = await client.media.list({
  channel: "whatsapp",
  phoneNumberId: "1131858666672190",
});

await client.messages.send({
  channel: "whatsapp",
  phoneNumberId: "1131858666672190",
  to: "+919999999999",
  type: "document",
  mediaId: media.id,
  filename: "invoice.pdf",
});
```

## Interactive Messages

Use the same `client.messages.send(...)` method for service-window interactions. FlowSell builds the provider-specific interactive payload internally.

Reply buttons:

```ts
await client.messages.send({
  channel: "whatsapp",
  phoneNumberId: "1131858666672190",
  to: "+919999999999",
  type: "buttons",
  body: "Choose an option",
  buttons: [
    { type: "reply", reply: { id: "yes", title: "Yes" } },
    { type: "reply", reply: { id: "no", title: "No" } },
  ],
});
```

Native WhatsApp Flow:

```ts
await client.messages.send({
  channel: "whatsapp",
  phoneNumberId: "1131858666672190",
  to: "+919999999999",
  type: "flow",
  body: "Complete your order details.",
  flowId: "1234567890",
  flowCta: "Open form",
  flowToken: "order_123",
  flowAction: "navigate",
  flowScreen: "ORDER_DETAILS",
  flowData: {
    order_id: "#1234",
  },
});
```

Other supported service-window message types include `list`, `cta_url`, `carousel`, `location`, `location_request`, `address`, `contacts`, `reaction`, and media types such as `image`, `audio`, `video`, `document`, and `sticker`.

## Advanced Templates

URL buttons:

```ts
await client.templates.create({
  channel: "whatsapp",
  phoneNumberId: "1131858666672190",
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
  phoneNumberId: "1131858666672190",
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

Send approved media-header templates with the same simple contract:

```ts
await client.messages.sendTemplate({
  channel: "whatsapp",
  phoneNumberId: "1131858666672190",
  to: "+919999999999",
  template: "invoice_ready",
  headerType: "document",
  headerMediaId: "uploaded_document_media_id",
  headerFilename: "invoice.pdf",
  variables: {
    invoice_id: "INV-1001",
  },
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
