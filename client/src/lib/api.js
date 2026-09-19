export const API_URL = (
  import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1"
).replace(/\/$/, "");

const TOKEN_KEY = "khelvora-session";
let accessToken = "";

try {
  accessToken = sessionStorage.getItem(TOKEN_KEY) || "";
} catch {
  // Memory-only sessions remain available.
}

export const getToken = () => accessToken;

export function setToken(token = "") {
  accessToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable in private browsing.
  }
  window.dispatchEvent(new Event("khelvora:session"));
}

export function refreshData() {
  window.dispatchEvent(new Event("khelvora:data"));
}

export function query(path, values = {}) {
  const params = new URLSearchParams(
    Object.entries(values).filter(([, value]) => value !== "" && value != null),
  );
  return `${path}${params.size ? `?${params}` : ""}`;
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function request(
  path,
  { method = "GET", body, signal, auth = true } = {},
) {
  const controller = new AbortController();
  const cancel = () => controller.abort();

  if (signal?.aborted) cancel();
  signal?.addEventListener("abort", cancel, { once: true });

  const timeout = setTimeout(cancel, 20000);
  const token = auth ? getToken() : "";
  const isForm = body instanceof FormData;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined && !isForm
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: body === undefined
        ? undefined
        : isForm ? body : JSON.stringify(body),
    });

    if (response.status === 204) {
      if (method !== "GET") refreshData();
      return null;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      if (response.status === 401 && token && token === getToken()) {
        setToken();
        window.dispatchEvent(new Event("khelvora:unauthorized"));
      }
      throw new ApiError(
        payload?.message || `Request failed (${response.status}). Please try again.`,
        response.status,
        payload?.errors,
      );
    }

    if (payload === null) {
      throw new ApiError(
        "The server returned an unexpected response. Check your API URL.",
        response.status,
      );
    }

    if (method !== "GET") refreshData();
    return Object.hasOwn(payload, "data") ? payload.data : payload;
  } catch (error) {
    if (error.name === "AbortError") {
      if (signal?.aborted) throw error;
      throw new ApiError("The server took too long to respond. Please try again.", 0);
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};