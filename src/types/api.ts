export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions<TBody = unknown> {
  url: string;
  method?: HttpMethod;
  data?: TBody;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  responseType?: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status?: number;
  headers?: Record<string, string>;
}

export interface PagedResponse<TItem = Record<string, unknown>> {
  items: TItem[];
  count?: number;
  total_pages?: number;
  current_page?: number;
}
