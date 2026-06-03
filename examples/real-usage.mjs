import { FlowSell } from '@flowsell/connect';

const client = new FlowSell({
  apiKey: process.env.FLOWSELL_API_KEY,
  baseUrl: process.env.FLOWSELL_API_BASE_URL,
});

const usage = await client.usage.get();

console.log(usage);
