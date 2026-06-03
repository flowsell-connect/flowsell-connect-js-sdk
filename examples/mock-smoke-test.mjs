import { FlowSell, FlowSellError } from '@flowsell/connect';

const client = new FlowSell({
  apiKey: 'test_key',
  baseUrl: 'https://example.test',
  fetch: async () =>
    new Response(JSON.stringify({ baseQuota: 10, packQuota: 5, consumed: 3 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
});

const usage = await client.usage.get();

console.log(
  JSON.stringify({
    ok: true,
    remaining: usage.remaining,
    hasErrorClass: typeof FlowSellError === 'function',
  })
);
