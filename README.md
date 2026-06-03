# FlowSell Connect SDK

Official JavaScript and TypeScript SDK for FlowSell Connect wrapper APIs.

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

const result = await client.messages.sendText({
  to: "919999999999",
  text: "Hello from FlowSell Connect SDK",
});

console.log(result);
```

## Template Messages

```ts
await client.messages.sendTemplate({
  to: "919999999999",
  name: "hello_world",
  language: "en",
  category: "marketing",
  countryCode: "IN",
  components: [],
});
```

## Usage

```ts
const usage = await client.usage.get();
console.log(usage.remaining);
```

The package uses the `x-api-key` header. Keep API key secrets in server-side environment variables.
