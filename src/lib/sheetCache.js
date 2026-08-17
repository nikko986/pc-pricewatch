import { SHEET_CACHE_KEY, SHEET_CACHE_TTL_MS } from "../config.js";

function getBrowserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function removeInvalidCache(storage) {
  try {
    storage?.removeItem(SHEET_CACHE_KEY);
  } catch {
    // Storage may be unavailable or blocked. The live request can still proceed.
  }
}

export function readSheetCache(storage = getBrowserStorage(), now = Date.now()) {
  if (!storage) return null;

  try {
    const serialized = storage.getItem(SHEET_CACHE_KEY);
    if (!serialized) return null;

    const cached = JSON.parse(serialized);
    const rows = cached?.response?.table?.rows;
    if (
      !Number.isFinite(cached?.cachedAt) ||
      cached?.response?.status !== "ok" ||
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      removeInvalidCache(storage);
      return null;
    }

    return {
      response: cached.response,
      cachedAt: new Date(cached.cachedAt),
      isFresh: now - cached.cachedAt < SHEET_CACHE_TTL_MS,
    };
  } catch {
    removeInvalidCache(storage);
    return null;
  }
}

export function writeSheetCache(response, storage = getBrowserStorage(), now = Date.now()) {
  if (!storage) return false;

  try {
    storage.setItem(
      SHEET_CACHE_KEY,
      JSON.stringify({
        cachedAt: now,
        response,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
