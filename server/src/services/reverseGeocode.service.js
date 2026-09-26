import { env } from "../config/env.js";
import AppError from "../utils/AppError.js";

const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

async function requestGeoapify(latitude, longitude, type) {
  const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
  url.search = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    limit: "1",
    ...(type ? { type } : {}),
    apiKey: env.geoapifyApiKey,
  }).toString();

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new AppError("Address lookup is temporarily unavailable.", 503);
  }
  const payload = await response.json();
  return payload.results?.[0] || null;
}

export async function reverseGeocode(latitude, longitude) {
  if (!env.geoapifyApiKey) {
    throw new AppError("Address lookup needs a Geoapify API key in server configuration.", 503);
  }

  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.address;
  if (cached) cache.delete(cacheKey);

  const result = await requestGeoapify(latitude, longitude);
  let postalCode = result?.postcode || "";
  if (!postalCode) {
    const postalResult = await requestGeoapify(latitude, longitude, "postcode");
    postalCode = postalResult?.postcode || "";
  }

  const address = {
    city: result?.city || result?.town || result?.village || result?.county || "",
    state: result?.state || "",
    postalCode,
    country: result?.country || "",
  };

  if (cache.size >= MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(cacheKey, { address, expiresAt: Date.now() + CACHE_TTL });
  return address;
}
