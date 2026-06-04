import { FlowSell, FlowSellError } from '@flowsell/connect';

const client = new FlowSell({
  apiKey: process.env.FLOWSELL_API_KEY,
  baseUrl: process.env.FLOWSELL_API_BASE_URL,
});

const to = process.env.FLOWSELL_TEST_RECIPIENT;
const template = process.env.FLOWSELL_TEST_TEMPLATE_NAME || 'order_update_en';

if (!to) {
  throw new Error('Set FLOWSELL_TEST_RECIPIENT to the WhatsApp number you want to message.');
}

async function main() {
  const templateDetails = await client.templates.get(template);
  console.log('template details', templateDetails);

  const result = await client.messages.sendTemplate({
    channel: 'whatsapp',
    to,
    template,
    language: process.env.FLOWSELL_TEST_TEMPLATE_LANGUAGE || 'en_US',
    variables: {
      customer_name: process.env.FLOWSELL_TEST_CUSTOMER_NAME || 'John',
      order_id: process.env.FLOWSELL_TEST_ORDER_ID || '#1234',
    },
  });

  console.log('template message', result);
}

try {
  await main();
} catch (error) {
  if (error instanceof FlowSellError) {
    console.error('FlowSellError', {
      message: error.message,
      status: error.status,
      body: error.body,
    });
    process.exitCode = 1;
  } else {
    throw error;
  }
}
