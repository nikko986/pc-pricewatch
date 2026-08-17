import assert from "node:assert/strict";
import test from "node:test";

import { SHEET_CACHE_KEY, SHEET_CACHE_TTL_MS } from "../config.js";
import { readSheetCache, writeSheetCache } from "./sheetCache.js";

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("writes and reads a fresh sheet response", () => {
  const storage = createStorage();
  const response = { status: "ok", table: { rows: [{ c: [{ v: "Part" }] }] } };

  assert.equal(writeSheetCache(response, storage, 1000), true);
  assert.deepEqual(readSheetCache(storage, 1000 + SHEET_CACHE_TTL_MS - 1), {
    response,
    cachedAt: new Date(1000),
    isFresh: true,
  });
});

test("keeps expired data available as a stale fallback", () => {
  const storage = createStorage();
  const response = { status: "ok", table: { rows: [{ c: [{ v: "Part" }] }] } };

  writeSheetCache(response, storage, 1000);

  assert.equal(readSheetCache(storage, 1000 + SHEET_CACHE_TTL_MS).isFresh, false);
});

test("discards malformed cache entries", () => {
  const storage = createStorage();
  storage.setItem(SHEET_CACHE_KEY, "not-json");

  assert.equal(readSheetCache(storage, 1000), null);
  assert.equal(storage.getItem(SHEET_CACHE_KEY), null);
});

test("fails safely when browser storage is unavailable", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(readSheetCache(storage), null);
  assert.equal(writeSheetCache({}, storage), false);
});
