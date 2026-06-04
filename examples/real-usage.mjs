import { FlowSell, FlowSellError } from '@flowsell/connect';

const client = new FlowSell({
  apiKey: process.env.FLOWSELL_API_KEY,
  baseUrl: process.env.FLOWSELL_API_BASE_URL,
});

async function main() {
  const usage = await client.usage.get();
  console.log('usage', usage);

  if (process.env.FLOWSELL_TEST_CREATE_TEMPLATE === '1') {
    const template = await client.templates.create({
      channel: 'whatsapp',
      name: process.env.FLOWSELL_TEST_TEMPLATE_NAME || 'track_order',
      category: 'UTILITY',
      content: `Hello {{customer_name}}
Your order {{order_id}} has shipped.
Track your order using the button below.`,
      buttons: [
        {
          type: 'url',
          text: 'Track Order',
          url: 'https://track.example.com/{{tracking_id}}',
        },
      ],
      sampleVariables: {
        customer_name: 'John',
        order_id: '#1234',
        tracking_id: '1234',
      },
    });
    console.log('template', template);
  }

  if (process.env.FLOWSELL_TEST_RECIPIENT) {
    const message = await client.messages.send({
      channel: 'whatsapp',
      to: process.env.FLOWSELL_TEST_RECIPIENT,
      message: 'Hello from FlowSell Connect SDK',
    });
    console.log('message', message);
  }
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
