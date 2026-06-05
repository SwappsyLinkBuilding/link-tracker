// Thin fetch wrapper. The token lives in localStorage and is attached to every
// request. Response envelope mirrors the server: { success, data?, message? }.

const TOKEN_KEY = "slt_token";

export type LinkStatus = "pending" | "live" | "removed";
export type LinkType = "dofollow" | "nofollow" | "sponsored" | "";
export type Particular = "free" | "exchange" | "paid" | "";

export interface TrackedLink {
  id: number;
  placementUrl: string;
  targetUrl: string;
  anchorText: string;
  partnerName: string;
  linkType: LinkType;
  particular: Particular;
  particularDetails: string;
  paidAmount: string;
  notes: string;
  status: LinkStatus;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkInput {
  placementUrl: string;
  targetUrl?: string;
  anchorText?: string;
  partnerName?: string;
  linkType?: LinkType;
  particular?: Particular;
  particularDetails?: string;
  paidAmount?: string;
  notes?: string;
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || (body && body.success === false)) {
    const message = body?.message || `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return body?.data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; email: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: { id: number; email: string } }>("/auth/me"),
};

export const linkApi = {
  list: () => request<{ links: TrackedLink[] }>("/links"),
  create: (input: LinkInput) =>
    request<{ link: TrackedLink }>("/links", { method: "POST", body: JSON.stringify(input) }),
  update: (id: number, input: Partial<LinkInput> & { status?: LinkStatus }) =>
    request<{ link: TrackedLink }>(`/links/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: number) => request<unknown>(`/links/${id}`, { method: "DELETE" }),

  // CSV export returns raw text/csv (not the JSON envelope), so it bypasses request().
  exportCsv: async (): Promise<string> => {
    const token = tokenStore.get();
    const res = await fetch("/api/links/export.csv", {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, "Export failed");
    return res.text();
  },
  importCsv: (csv: string) =>
    request<{ imported: number; skipped: number }>("/links/import", {
      method: "POST",
      body: JSON.stringify({ csv }),
    }),
};

export { ApiError };
