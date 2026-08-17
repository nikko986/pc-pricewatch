import { useEffect, useState } from "react";

import {
  SHEET_CALLBACK,
  SHEET_GID,
  SHEET_ID,
  SHEET_LOAD_TIMEOUT_MS,
} from "../config.js";
import { parseSheet } from "../lib/pricewatch.js";
import { readSheetCache, writeSheetCache } from "../lib/sheetCache.js";

const emptyResult = {
  status: "loading",
  products: [],
  error: null,
  refreshedAt: null,
  source: null,
  isRefreshing: false,
  isStale: false,
};

export function useSheetData(retryKey) {
  const [result, setResult] = useState(emptyResult);

  useEffect(() => {
    let active = true;
    let timeout;
    let cachedResult = null;

    const cached = readSheetCache();
    if (cached) {
      try {
        cachedResult = {
          status: "ready",
          products: parseSheet(cached.response),
          error: null,
          refreshedAt: cached.cachedAt,
          source: "cache",
          isRefreshing: !cached.isFresh,
          isStale: !cached.isFresh,
        };
      } catch {
        cachedResult = null;
      }
    }

    setResult(cachedResult ?? emptyResult);
    document.getElementById("sheet-data-script")?.remove();

    if (cached?.isFresh && cachedResult && retryKey === 0) {
      return () => {
        active = false;
      };
    }

    const finishWithError = (error = new Error("Please try again.")) => {
      window.clearTimeout(timeout);
      if (active) {
        setResult(
          cachedResult
            ? {
                ...cachedResult,
                error,
                isRefreshing: false,
                isStale: true,
              }
            : {
                ...emptyResult,
                status: "error",
                error,
              },
        );
      }
    };

    window[SHEET_CALLBACK] = (response) => {
      if (!active) return;
      window.clearTimeout(timeout);

      try {
        const refreshedAt = new Date();
        const products = parseSheet(response);
        writeSheetCache(response, undefined, refreshedAt.getTime());
        setResult({
          status: "ready",
          products,
          error: null,
          refreshedAt,
          source: "network",
          isRefreshing: false,
          isStale: false,
        });
      } catch (error) {
        finishWithError(error);
      }
    };

    const script = document.createElement("script");
    script.id = "sheet-data-script";
    script.referrerPolicy = "no-referrer";
    script.onerror = () =>
      finishWithError(new Error("The Google Sheets request was blocked or unavailable."));

    const query = new URLSearchParams({
      gid: SHEET_GID,
      tqx: `out:json;responseHandler:${SHEET_CALLBACK}`,
      _: Date.now().toString(),
    });
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${query}`;
    document.head.append(script);
    timeout = window.setTimeout(
      () => finishWithError(new Error("The sheet took too long to respond.")),
      SHEET_LOAD_TIMEOUT_MS,
    );

    return () => {
      active = false;
      window.clearTimeout(timeout);
      script.remove();
      delete window[SHEET_CALLBACK];
    };
  }, [retryKey]);

  return result;
}
