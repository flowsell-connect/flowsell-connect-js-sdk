export type FlowSellConfig = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
};

export type FlowSellRequestOptions = {
  signal?: AbortSignal;
  headers?: HeadersInit;
};

export type MessageChannel = "whatsapp" | "instagram" | "telegram" | "facebook" | "slack" | "discord" | "sms" | "viber" | "wechat" | "line";

export type SendMessageInput = {
  channel?: MessageChannel;
  to: string;
  message: string;
};

export type SendTextInput = SendMessageInput & {
  text?: string;
};

export type TemplateVariables = Record<string, string | number | boolean | null>;

export type SendTemplateInput = {
  channel?: MessageChannel;
  to: string;
  template: string;
  variables?: TemplateVariables;
  language?: string;
  category?: string;
  countryCode?: string;
};

export type TemplateButtonInput = {
  type: "url" | "phone" | "reply" | "quick_reply";
  text: string;
  url?: string;
  phoneNumber?: string;
};

export type CreateTemplateInput = {
  channel?: MessageChannel;
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION" | string;
  language?: string;
  content: string;
  headerType?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | "NONE";
  headerText?: string;
  buttons?: TemplateButtonInput[];
  sampleVariables?: TemplateVariables;
};

export type ListTemplatesInput = {
  channel?: MessageChannel;
  limit?: number;
};

export type GetTemplateInput = {
  channel?: MessageChannel;
  name: string;
};

export type DeleteTemplateInput = {
  channel?: MessageChannel;
  name: string;
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
      send: (input, options) =>
        this.request("/v1/messages/send", {
          method: "POST",
          body: input,
          ...options,
        }),
      sendText: (input, options) =>
        this.request("/v1/messages/send", {
          method: "POST",
          body: {
            ...input,
            message: input.message || input.text || "",
          },
          ...options,
        }),
      sendTemplate: (input, options) =>
        this.request("/v1/messages/template", {
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

    this.templates = {
      list: (input = {}, options) => {
        const params = new URLSearchParams();
        if (input.limit) params.set("limit", String(input.limit));
        const query = params.toString();
        return this.request(`/v1/templates${query ? `?${query}` : ""}`, {
          method: "GET",
          ...options,
        });
      },
      get: (input, options) => {
        const name = typeof input === "string" ? input : input.name;
        return this.request(`/v1/templates/${encodeURIComponent(name)}`, {
          method: "GET",
          ...options,
        });
      },
      create: (input, options) =>
        this.request("/v1/templates", {
          method: "POST",
          body: input,
          ...options,
        }),
      delete: (input, options) =>
        this.request("/v1/templates/delete", {
          method: "POST",
          body: input,
          ...options,
        }),
    };
  }

  messages: {
    send: (
      input: SendMessageInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
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

  templates: {
    list: (
      input?: ListTemplatesInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
    get: (
      input: string | GetTemplateInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
    create: (
      input: CreateTemplateInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
    delete: (
      input: DeleteTemplateInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
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
