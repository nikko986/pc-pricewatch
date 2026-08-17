import { useEffect, useMemo, useRef, useState } from "react";

const SHEET_ID = "1xrVw1CVMB9cK0v9qSZCasGQviQo1G_sYIpVrVccah20";
const SHEET_GID = "2041302730";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${SHEET_GID}#gid=${SHEET_GID}`;
const CALLBACK = "__pricewatchSheetLoaded";
const LOAD_TIMEOUT_MS = 15000;

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function cellText(cell) {
  if (!cell || (cell.v === null && !cell.f)) return "";
  return String(cell.f ?? cell.v ?? "").trim();
}

function parsePrice(cell) {
  if (!cell || cell.v === null || cell.v === undefined) return null;
  if (typeof cell.v === "number") return cell.v > 0 ? cell.v : null;
  const parsed = Number(String(cell.f ?? cell.v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCategory(name) {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/Gpus/g, "GPUs")
    .replace(/Cpus/g, "CPUs")
    .replace(/Gpu\b/g, "GPU")
    .replace(/Cpu\b/g, "CPU")
    .replace(/Nvidia/g, "NVIDIA")
    .replace(/Amd/g, "AMD");
}

function buildPeriods(headerCells) {
  const labels = headerCells.map(cellText);
  const years = labels.flatMap((label) => label.match(/20\d{2}/g) || []).map(Number);
  let year = years.length ? Math.max(...years) : new Date().getFullYear();
  let priorMonth = null;

  return labels.map((label, index) => {
    const dateMatch = label.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (dateMatch) {
      const month = Number(dateMatch[1]);
      const day = Number(dateMatch[2]);
      if (priorMonth !== null && month > priorMonth) year -= 1;
      priorMonth = month;
      const date = new Date(year, month - 1, day);
      return {
        index,
        label,
        date,
        display: date.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    }

    if (/^Week\s/i.test(label)) {
      return { index, label, date: null, display: `${label} · older record` };
    }

    return null;
  });
}

function parseSheet(response) {
  if (!response || response.status !== "ok" || !response.table?.rows?.length) {
    const message = response?.errors?.[0]?.detailed_message || "The sheet returned an invalid response.";
    throw new Error(message);
  }

  const rows = response.table.rows;
  const periods = buildPeriods(rows[0].c || []);
  const products = [];
  let category = "Uncategorised";

  rows.slice(1).forEach((row, sheetIndex) => {
    const cells = row.c || [];
    const name = cellText(cells[0]);
    if (!name) return;

    const pricedCells = cells.slice(1).filter((cell) => parsePrice(cell) !== null);
    const nonEmptyCells = cells.slice(1).filter((cell) => cellText(cell));

    if (pricedCells.length === 0 && nonEmptyCells.length === 0) {
      category = normalizeCategory(name);
      return;
    }

    if (pricedCells.length === 0) return;

    const history = periods.flatMap((period, index) => {
      if (!period) return [];
      const value = parsePrice(cells[index]);
      return value === null ? [] : [{ ...period, value }];
    });

    if (!history.length) return;
    const current = history[0];
    const previous = history[1] || null;
    const change = previous ? ((current.value - previous.value) / previous.value) * 100 : null;
    const values = history.map((point) => point.value);

    products.push({
      id: `part-${sheetIndex}`,
      name,
      category,
      sheetIndex,
      history,
      current,
      previous,
      change,
      low: Math.min(...values),
      high: Math.max(...values),
    });
  });

  if (!products.length) throw new Error("No product rows were found in the public sheet.");
  return products;
}

function formatChange(value) {
  if (value === null || !Number.isFinite(value)) return "No prior data";
  if (Math.abs(value) < 0.005) return "0.0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function changeClass(value) {
  if (value === null || Math.abs(value) < 0.005) return "flat";
  return value < 0 ? "down" : "up";
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

function Sparkline({ product }) {
  const points = [...product.history].reverse().slice(-24);
  const width = 116;
  const height = 34;
  const padding = 2;
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const spread = max - min || 1;
  const x = (index) => padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
  const y = (value) => height - padding - ((value - min) / spread) * (height - padding * 2);
  const color = product.change !== null && product.change < 0 ? "#137a55" : "#bb3e4a";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" role="img" aria-label={`${product.name} recent price trend`}>
      <line x1="0" x2={width} y1={height - 1} y2={height - 1} stroke="#e2e8ed" />
      <polyline
        points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductRow({ product, onSelect }) {
  const onRowKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(product);
    }
  };

  return (
    <tr tabIndex="0" onClick={() => onSelect(product)} onKeyDown={onRowKeyDown}>
      <td>
        <span className="part-button">
          {product.name}
          <small>{product.category}</small>
        </span>
      </td>
      <td><span className="category-tag">{product.category}</span></td>
      <td className="price">
        {peso.format(product.current.value)}
        <small>{product.current.display}</small>
      </td>
      <td>
        <span className={`delta ${changeClass(product.change)}`}>
          {product.change !== null && product.change < 0 ? "↓ " : product.change > 0 ? "↑ " : ""}
          {formatChange(product.change)}
        </span>
      </td>
      <td className="range">{peso.format(product.low)} – {peso.format(product.high)}</td>
      <td><Sparkline product={product} /></td>
    </tr>
  );
}

function PriceChart({ product }) {
  const points = [...product.history].reverse();
  const width = 680;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 62 };
  const minValue = Math.min(...points.map((point) => point.value));
  const maxValue = Math.max(...points.map((point) => point.value));
  const extra = Math.max((maxValue - minValue) * 0.12, maxValue * 0.02);
  const min = Math.max(0, minValue - extra);
  const max = maxValue + extra;
  const spread = max - min || 1;
  const x = (index) => pad.left + (index / Math.max(1, points.length - 1)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + (1 - (value - min) / spread) * (height - pad.top - pad.bottom);
  const latest = points.at(-1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {[0, 1, 2].map((index) => {
        const value = max - (spread * index) / 2;
        const lineY = y(value);
        return (
          <g key={index}>
            <line x1={pad.left} x2={width - pad.right} y1={lineY} y2={lineY} stroke="#dfe5ec" strokeDasharray="4 5" />
            <text x={pad.left - 8} y={lineY + 4} textAnchor="end" fill="#7c8797" fontSize="10">
              ₱{Math.round(value / 1000)}k
            </text>
          </g>
        );
      })}
      <polyline
        points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}
        fill="none"
        stroke="#087e74"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={x(points.length - 1)} cy={y(latest.value)} r="5" fill="#42d6c8" stroke="#087e74" strokeWidth="2" />
      <text x={pad.left} y={height - 6} fill="#7c8797" fontSize="10">{points[0].display}</text>
      <text x={width - pad.right} y={height - 6} textAnchor="end" fill="#7c8797" fontSize="10">{latest.display}</text>
    </svg>
  );
}

function PartDialog({ product, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (product && dialog && !dialog.open) dialog.showModal();
    if (!product && dialog?.open) dialog.close();
  }, [product]);

  if (!product) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="dialog-header">
        <div>
          <span className="kicker">{product.category}</span>
          <h2 id="dialog-title">{product.name}</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Close details" onClick={onClose}>×</button>
      </div>
      <div className="dialog-content">
        <div className="detail-stats">
          <div><span>Latest</span><strong>{peso.format(product.current.value)}</strong></div>
          <div><span>Change</span><strong className={changeClass(product.change)}>{formatChange(product.change)}</strong></div>
          <div><span>Low</span><strong>{peso.format(product.low)}</strong></div>
          <div><span>High</span><strong>{peso.format(product.high)}</strong></div>
        </div>
        <div className="chart-heading">
          <h3>Price history</h3>
          <span>Latest: {product.current.display}</span>
        </div>
        <div
          className="detail-chart"
          role="img"
          aria-label={`${product.name} price history from ${product.history.at(-1).display} to ${product.current.display}`}
        >
          <PriceChart product={product} />
        </div>
        <div className="history-list-wrap">
          <table className="history-list">
            <thead><tr><th scope="col">Recorded</th><th scope="col">Average price</th></tr></thead>
            <tbody>
              {product.history.slice(0, 12).map((point, index) => (
                <tr key={`${point.label}-${index}`}>
                  <td>{point.display}</td>
                  <td>{peso.format(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  );
}

function useSheetData(retryKey) {
  const [result, setResult] = useState({ status: "loading", products: [], error: null, refreshedAt: null });

  useEffect(() => {
    let active = true;
    setResult({ status: "loading", products: [], error: null, refreshedAt: null });
    document.getElementById("sheet-data-script")?.remove();

    const finishWithError = (error = new Error("Please try again.")) => {
      if (active) setResult({ status: "error", products: [], error, refreshedAt: null });
    };

    window[CALLBACK] = (response) => {
      if (!active) return;
      window.clearTimeout(timeout);
      try {
        setResult({ status: "ready", products: parseSheet(response), error: null, refreshedAt: new Date() });
      } catch (error) {
        finishWithError(error);
      }
    };

    const script = document.createElement("script");
    script.id = "sheet-data-script";
    script.referrerPolicy = "no-referrer";
    script.onerror = () => finishWithError(new Error("The Google Sheets request was blocked or unavailable."));
    const query = new URLSearchParams({
      gid: SHEET_GID,
      tqx: `out:json;responseHandler:${CALLBACK}`,
      _: Date.now().toString(),
    });
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${query}`;
    document.head.append(script);
    const timeout = window.setTimeout(() => finishWithError(new Error("The sheet took too long to respond.")), LOAD_TIMEOUT_MS);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      script.remove();
      delete window[CALLBACK];
    };
  }, [retryKey]);

  return result;
}

export default function App() {
  const [retryKey, setRetryKey] = useState(0);
  const { status, products, error, refreshedAt } = useSheetData(retryKey);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("sheet");
  const [dropsOnly, setDropsOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = useMemo(() => [...new Set(products.map((product) => product.category))], [products]);
  const latest = useMemo(() => products
    .flatMap((product) => product.history)
    .filter((point) => point.date)
    .sort((a, b) => b.date - a.date)[0], [products]);
  const drops = useMemo(() => products.filter((product) => product.change !== null && product.change < 0).length, [products]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products
      .filter((product) => {
        const matchesQuery = !query || `${product.name} ${product.category}`.toLocaleLowerCase().includes(query);
        const matchesCategory = category === "all" || product.category === category;
        const matchesDrop = !dropsOnly || (product.change !== null && product.change < 0);
        return matchesQuery && matchesCategory && matchesDrop;
      })
      .sort((a, b) => {
        switch (sort) {
          case "price-asc": return a.current.value - b.current.value;
          case "price-desc": return b.current.value - a.current.value;
          case "drop": return (a.change ?? Infinity) - (b.change ?? Infinity);
          case "name": return a.name.localeCompare(b.name, undefined, { numeric: true });
          default: return a.sheetIndex - b.sheetIndex;
        }
      });
  }, [products, search, category, sort, dropsOnly]);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setSort("sheet");
    setDropsOnly(false);
  };

  return (
    <>
      <a className="skip-link" href="#price-table">Skip to prices</a>
      <header className="site-header">
        <nav className="nav shell" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="PC Pricewatch home">
            <span className="brand-mark" aria-hidden="true">PW</span>
            <span>PC Pricewatch <b>PH</b></span>
          </a>
          <a className="source-link" href={SHEET_URL} target="_blank" rel="noreferrer">
            View source sheet <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <div className="hero shell" id="top">
          <div className="eyebrow"><span className="live-dot" aria-hidden="true" />Public, community-maintained data</div>
          <h1>Know the price.<br /><span>Time your upgrade.</span></h1>
          <p>Track average Philippine prices for popular GPUs and CPUs, with the latest movement and historical range in one clean view.</p>
          <div className="hero-meta">
            <span className={`status-pill ${status === "ready" ? "is-ready" : status === "error" ? "is-error" : ""}`} role="status" aria-live="polite">
              {status === "loading" && <Spinner />}
              {status === "loading" ? "Loading live prices…" : status === "ready" ? "Live sheet connected" : "Live data unavailable"}
            </span>
            <span>
              {status === "ready" && refreshedAt
                ? `Refreshed ${refreshedAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`
                : status === "error" ? error?.message : "Connecting to Google Sheets"}
            </span>
          </div>
        </div>
      </header>

      <main className="shell main-content">
        <section className="stats" aria-label="Pricewatch summary">
          <article className="stat-card">
            <span className="stat-label">Parts tracked</span><strong>{status === "ready" ? products.length : "—"}</strong><small>across GPUs and CPUs</small>
          </article>
          <article className="stat-card">
            <span className="stat-label">Latest sheet date</span>
            <strong>{latest?.date ? latest.date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</strong>
            <small>most recent recorded update</small>
          </article>
          <article className="stat-card stat-card-accent">
            <span className="stat-label">Prices trending down</span><strong>{status === "ready" ? drops : "—"}</strong><small>since each part's prior reading</small>
          </article>
        </section>

        <section className="explorer" aria-labelledby="explorer-title">
          <div className="section-heading">
            <div><span className="kicker">Live price explorer</span><h2 id="explorer-title">Find your next part</h2></div>
            <p aria-live="polite">{status === "ready" ? `${visibleProducts.length} of ${products.length} parts` : status === "error" ? "No data loaded" : "Waiting for sheet data…"}</p>
          </div>

          <div className="toolbar" aria-label="Price filters">
            <label className="search-field">
              <span className="sr-only">Search parts</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search 5070, Ryzen, Intel…" autoComplete="off" />
            </label>
            <label className="select-field">
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="select-field">
              <span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="sheet">Sheet order</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="drop">Biggest price drop</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
            <label className="drop-toggle">
              <input checked={dropsOnly} onChange={(event) => setDropsOnly(event.target.checked)} type="checkbox" />
              <span aria-hidden="true" />Price drops only
            </label>
          </div>

          {status === "error" && (
            <div className="error-panel">
              <div><strong>Live prices could not be loaded.</strong><p>The source sheet may be temporarily unavailable or blocked by this network.</p></div>
              <button className="button" type="button" onClick={() => setRetryKey((key) => key + 1)}>Try again</button>
            </div>
          )}

          {status === "loading" ? (
            <div className="loading-state"><Spinner /> Reading the public sheet…</div>
          ) : visibleProducts.length ? (
            <div className="table-wrap">
              <table id="price-table">
                <thead><tr><th scope="col">Part</th><th scope="col">Category</th><th scope="col">Latest price</th><th scope="col">Change</th><th scope="col">Tracked range</th><th scope="col">Trend</th></tr></thead>
                <tbody>{visibleProducts.map((product) => <ProductRow key={product.id} product={product} onSelect={setSelectedProduct} />)}</tbody>
              </table>
            </div>
          ) : status === "ready" ? (
            <div className="empty-state">
              <span aria-hidden="true">⌕</span><h3>No matching parts</h3><p>Try a different search or clear one of the filters.</p>
              <button className="button button-light" type="button" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : null}
        </section>

        <section className="about-strip" aria-label="About this data">
          <div><span className="kicker">Open data, clearer decisions</span><h2>Built on a public community pricewatch.</h2></div>
          <p>Prices are presented as recorded in the source sheet and are not store quotes. Availability, exact models, and final checkout prices can vary.</p>
        </section>
      </main>

      <footer><div className="shell footer-inner"><p>PC Pricewatch PH · Live data from Google Sheets</p><a href={SHEET_URL} target="_blank" rel="noreferrer">Source and methodology ↗</a></div></footer>
      <PartDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
