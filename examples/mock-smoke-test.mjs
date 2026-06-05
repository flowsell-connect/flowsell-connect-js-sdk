import { FlowSell, FlowSellError } from '@flowsell/connect';

const requests = [];
const client = new FlowSell({
  apiKey: 'test_key',
  baseUrl: 'https://example.test',
  fetch: async (url, init) => {
    requests.push({ url, method: init?.method, body: init?.body });
    if (String(url).endsWith('/v1/usage')) {
      return new Response(JSON.stringify({ baseQuota: 10, packQuota: 5, consumed: 3 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  },
});

const usage = await client.usage.get();
await client.messages.send({
  channel: 'whatsapp',
  phoneNumberId: '1131858666672190',
  to: '+919999999999',
  message: 'Hello from FlowSell Connect SDK',
});

console.log(
  JSON.stringify({
    ok: true,
    remaining: usage.remaining,
    messagePath: requests.at(-1)?.url,
    hasErrorClass: typeof FlowSellError === 'function',
  })
);
