import { HARDWARE_SUGAR_URL, SHEET_URL } from "../config.js";
import { Spinner } from "./Spinner.jsx";

export function SiteHeader({ status, error, refreshedAt, source, isRefreshing, isStale }) {
  const refreshTime = refreshedAt?.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <header className="site-header">
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="PC Pricewatch home">
          <span className="brand-mark" aria-hidden="true">
            PW
          </span>
          <span>
            PC Pricewatch <b>PH</b>
          </span>
        </a>
        <a className="source-link" href={SHEET_URL} target="_blank" rel="noreferrer">
          View Hardware Sugar sheet <span aria-hidden="true">↗</span>
        </a>
      </nav>
      <div className="hero shell" id="top">
        <div className="eyebrow">
          <span className="live-dot" aria-hidden="true" />
          Price data by{" "}
          <a href={HARDWARE_SUGAR_URL} target="_blank" rel="noreferrer">
            Hardware Sugar
          </a>
        </div>
        <h1>
          Know the price.
          <br />
          <span>Time your upgrade.</span>
        </h1>
        <p>
          Track average Philippine prices for popular GPUs and CPUs, with the latest movement and
          historical range in one clean view.
        </p>
        <div className="hero-meta">
          <span
            className={`status-pill ${status === "ready" ? "is-ready" : status === "error" ? "is-error" : ""}`}
            role="status"
            aria-live="polite"
          >
            {status === "loading" && <Spinner />}
            {status === "loading"
              ? "Loading live prices…"
              : status === "ready"
                ? isRefreshing
                  ? "Updating cached prices…"
                  : isStale
                    ? "Using cached prices"
                    : source === "cache"
                      ? "Prices loaded from cache"
                      : "Live sheet connected"
                : "Live data unavailable"}
          </span>
          <span>
            {status === "ready" && refreshedAt
              ? `${source === "cache" ? "Last refreshed" : "Refreshed"} ${refreshTime}${isStale && error ? " · Live refresh unavailable" : ""}`
              : status === "error"
                ? error?.message
                : "Connecting to Google Sheets"}
          </span>
        </div>
      </div>
    </header>
  );
}
