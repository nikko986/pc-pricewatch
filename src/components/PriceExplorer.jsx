import { ProductRow } from "./ProductRow.jsx";
import { Spinner } from "./Spinner.jsx";

const brands = [
  { value: "nvidia", label: "NVIDIA" },
  { value: "amd", label: "AMD" },
  { value: "intel", label: "Intel" },
];

const partTypes = [
  { value: "gpu", label: "GPU" },
  { value: "cpu", label: "CPU" },
];

export function PriceExplorer({
  status,
  products,
  visibleProducts,
  filters,
  onFilterChange,
  onClearFilters,
  onRetry,
  onSelectProduct,
}) {
  const { search, brand, partType, sort, dropsOnly } = filters;

  return (
    <section className="explorer" aria-labelledby="explorer-title">
      <div className="section-heading">
        <div>
          <span className="kicker">Live price explorer</span>
          <h2 id="explorer-title">Find your next part</h2>
        </div>
        <p aria-live="polite">
          {status === "ready"
            ? `${visibleProducts.length} of ${products.length} parts`
            : status === "error"
              ? "No data loaded"
              : "Waiting for sheet data…"}
        </p>
      </div>

      <div className="toolbar" aria-label="Price filters">
        <label className="search-field">
          <span className="sr-only">Search parts</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
          </svg>
          <input
            value={search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            type="search"
            placeholder="Search 5070, Ryzen, Intel…"
            autoComplete="off"
          />
        </label>
        <label className="select-field">
          <span>Brand</span>
          <select value={brand} onChange={(event) => onFilterChange("brand", event.target.value)}>
            <option value="all">All brands</option>
            {brands.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span>Part type</span>
          <select
            value={partType}
            onChange={(event) => onFilterChange("partType", event.target.value)}
          >
            <option value="all">All parts</option>
            {partTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span>Sort by</span>
          <select value={sort} onChange={(event) => onFilterChange("sort", event.target.value)}>
            <option value="sheet">Sheet order</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="drop">Biggest price drop</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
        <label className="drop-toggle">
          <input
            checked={dropsOnly}
            onChange={(event) => onFilterChange("dropsOnly", event.target.checked)}
            type="checkbox"
          />
          <span aria-hidden="true" />
          Price drops only
        </label>
      </div>

      {status === "error" && (
        <div className="error-panel">
          <div>
            <strong>Live prices could not be loaded.</strong>
            <p>The source sheet may be temporarily unavailable or blocked by this network.</p>
          </div>
          <button className="button" type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {status === "loading" ? (
        <div className="loading-state">
          <Spinner /> Reading the public sheet…
        </div>
      ) : visibleProducts.length ? (
        <div className="table-wrap">
          <table id="price-table">
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">Category</th>
                <th scope="col">Latest price</th>
                <th scope="col">Change</th>
                <th scope="col">Tracked range</th>
                <th scope="col">Trend</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <ProductRow key={product.id} product={product} onSelect={onSelectProduct} />
              ))}
            </tbody>
          </table>
        </div>
      ) : status === "ready" ? (
        <div className="empty-state">
          <span aria-hidden="true">⌕</span>
          <h3>No matching parts</h3>
          <p>Try a different search or clear one of the filters.</p>
          <button className="button button-light" type="button" onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
      ) : null}
    </section>
  );
}
