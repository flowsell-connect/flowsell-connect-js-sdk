export type FlowSellConfig = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
};

export type FlowSellRequestOptions = {
  signal?: AbortSignal;
  headers?: HeadersInit;
};

export type SendTextInput = {
  to: string;
  text: string;
  phoneNumberId?: string;
};

export type SendTemplateInput = {
  to: string;
  name: string;
  language: string;
  category: string;
  countryCode: string;
  components?: unknown[];
  phoneNumberId?: string;
};

export type UsageResponse = {
  baseQuota: number;
  packQuota: number;
  consumed: number;
  remaining: number;
  subscription?: {
    id?: string;
    status?: string;
    billingCycle?: "MONTHLY" | "YEARLY";
    plan?: {
      name: string;
      slug?: string;
    };
  };
};

export class FlowSellError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "FlowSellError";
    this.status = status;
    this.body = body;
  }
}

const defaultBaseUrl =
  "https://cmwhd2hdarqpip3krnua6ep3le0qhstm.lambda-url.ap-south-1.on.aws";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export class FlowSell {
  readonly apiKey: string;
  readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(config: FlowSellConfig) {
    if (!config.apiKey) {
      throw new Error("FlowSell API key is required.");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = trimTrailingSlash(config.baseUrl || defaultBaseUrl);
    this.fetcher = config.fetch || fetch;

    this.messages = {
      sendText: (input, options) =>
        this.request("/v1/messages/text", {
          method: "POST",
          body: input,
          ...options,
        }),
      sendTemplate: (input, options) =>
        this.request("/v1/messages/templates", {
          method: "POST",
          body: input,
          ...options,
        }),
    };

    this.usage = {
      get: async (options) => {
        const usage = await this.request<Omit<UsageResponse, "remaining">>(
          "/v1/usage",
          {
            method: "GET",
            ...options,
          },
        );
        return {
          ...usage,
          remaining: Math.max(
            0,
            usage.baseQuota + usage.packQuota - usage.consumed,
          ),
        };
      },
    };
  }

  messages: {
    sendText: (
      input: SendTextInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
    sendTemplate: (
      input: SendTemplateInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
  };

  usage: {
    get: (options?: FlowSellRequestOptions) => Promise<UsageResponse>;
  };

  async request<T = unknown>(
    path: string,
    options: FlowSellRequestOptions & {
      method?: "GET" | "POST" | "PATCH" | "DELETE";
      body?: unknown;
    } = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("x-api-key", this.apiKey);

    const hasBody = options.body !== undefined;
    if (hasBody && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      signal: options.signal,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    const body = await response
      .json()
      .catch(() => response.text().catch(() => undefined));

    if (!response.ok) {
      const message =
        body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : `FlowSell request failed with status ${response.status}`;
      throw new FlowSellError(message, response.status, body);
    }

    return body as T;
  }
}

export const FlowSellConnect = FlowSell;
