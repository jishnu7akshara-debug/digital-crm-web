/**
 * Digital Footprint OS API Client.
 * All browser requests proxy to FastAPI /api/v1 via Next.js or Vercel routing.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiError extends Error {
  code: string;
  details?: any;
  status: number;

  constructor(message: string, code: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("/api") ? endpoint : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  // Handle PDF / Blob streams
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/pdf")) {
    const blob = await response.blob();
    return blob as unknown as T;
  }

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    data: null as any,
    error: {
      code: "PARSE_ERROR",
      message: `Failed to parse response (Status: ${response.status})`,
    },
  }));

  if (!response.ok || !json.success) {
    const err = json.error || {
      code: `HTTP_${response.status}`,
      message: "An unexpected error occurred.",
    };
    throw new ApiError(err.message, err.code, response.status, err.details);
  }

  return json.data;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchJson<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchJson<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchJson<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchJson<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchJson<T>(endpoint, { method: "DELETE", ...options }),

  downloadPdf: async (endpoint: string, filename: string) => {
    const blob = await fetchJson<Blob>(endpoint);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

