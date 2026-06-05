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
  phoneNumberId?: string;
  message?: string;
  text?: string;
  type?:
    | "text"
    | "image"
    | "audio"
    | "video"
    | "document"
    | "sticker"
    | "location"
    | "location_request"
    | "address"
    | "address_message"
    | "contacts"
    | "interactive"
    | "button"
    | "buttons"
    | "reply_buttons"
    | "list"
    | "cta_url"
    | "flow"
    | "nfm_flow"
    | "carousel"
    | "reaction"
    | string;
  body?: string;
  footer?: string;
  header?: Record<string, unknown>;
  mediaId?: string;
  link?: string;
  caption?: string;
  filename?: string;
  location?: Record<string, unknown>;
  contacts?: unknown[];
  address?: Record<string, unknown>;
  buttons?: unknown[];
  sections?: unknown[];
  buttonText?: string;
  displayText?: string;
  url?: string;
  flowId?: string;
  flowCta?: string;
  flowToken?: string;
  flowAction?: string;
  flowScreen?: string;
  flowData?: Record<string, unknown>;
  cards?: unknown[];
  messageId?: string;
  emoji?: string;
  reaction?: Record<string, unknown>;
  interactive?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

export type SendTextInput = SendMessageInput & {
  text?: string;
};

export type TemplateVariables = Record<string, string | number | boolean | null>;

export type SendTemplateInput = {
  channel?: MessageChannel;
  to: string;
  phoneNumberId?: string;
  template: string;
  variables?: TemplateVariables;
  language?: string;
  category?: string;
  countryCode?: string;
  headerType?: "image" | "video" | "document";
  headerMediaId?: string;
  headerMediaLink?: string;
  headerFilename?: string;
  components?: unknown[];
  buttonPayloads?: Array<Record<string, string | number | boolean | null>>;
};

export type TemplateButtonInput = {
  type: "url" | "phone" | "reply" | "quick_reply";
  text: string;
  url?: string;
  phoneNumber?: string;
};

export type CreateTemplateInput = {
  channel?: MessageChannel;
  phoneNumberId?: string;
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION" | string;
  language?: string;
  content: string;
  headerType?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | "NONE";
  headerText?: string;
  sampleMediaHandle?: string;
  buttons?: TemplateButtonInput[];
  sampleVariables?: TemplateVariables;
};

export type ListTemplatesInput = {
  channel?: MessageChannel;
  phoneNumberId?: string;
  limit?: number;
};

export type GetTemplateInput = {
  channel?: MessageChannel;
  phoneNumberId?: string;
  name: string;
};

export type DeleteTemplateInput = {
  channel?: MessageChannel;
  phoneNumberId?: string;
  name: string;
};

export type UploadMediaInput = {
  channel?: MessageChannel;
  phoneNumberId?: string;
  url: string;
  filename?: string;
  mimeType?: string;
};

export type ListMediaInput = {
  channel?: MessageChannel;
  phoneNumberId?: string;
  limit?: number;
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
        if (input.phoneNumberId)
          params.set("phoneNumberId", input.phoneNumberId);
        const query = params.toString();
        return this.request(`/v1/templates${query ? `?${query}` : ""}`, {
          method: "GET",
          ...options,
        });
      },
      get: (input, options) => {
        const name = typeof input === "string" ? input : input.name;
        const phoneNumberId =
          typeof input === "string" ? undefined : input.phoneNumberId;
        const params = new URLSearchParams();
        if (phoneNumberId) params.set("phoneNumberId", phoneNumberId);
        const query = params.toString();
        return this.request(
          `/v1/templates/${encodeURIComponent(name)}${query ? `?${query}` : ""}`,
          {
            method: "GET",
            ...options,
          },
        );
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

    this.media = {
      upload: (input, options) =>
        this.request("/v1/media/upload", {
          method: "POST",
          body: input,
          ...options,
        }),
      list: (input = {}, options) => {
        const params = new URLSearchParams();
        if (input.limit) params.set("limit", String(input.limit));
        if (input.phoneNumberId)
          params.set("phoneNumberId", input.phoneNumberId);
        const query = params.toString();
        return this.request(`/v1/media${query ? `?${query}` : ""}`, {
          method: "GET",
          ...options,
        });
      },
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

  media: {
    upload: (
      input: UploadMediaInput,
      options?: FlowSellRequestOptions,
    ) => Promise<unknown>;
    list: (
      input?: ListMediaInput,
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
