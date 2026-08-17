import { useMemo, useState } from "react";

import { DataAttribution, SiteFooter } from "./components/DataAttribution.jsx";
import { PartDialog } from "./components/PartDialog.jsx";
import { PriceExplorer } from "./components/PriceExplorer.jsx";
import { SiteHeader } from "./components/SiteHeader.jsx";
import { SummaryStats } from "./components/SummaryStats.jsx";
import { useSheetData } from "./hooks/useSheetData.js";
import { filterAndSortProducts } from "./lib/pricewatch.js";

const defaultFilters = {
  search: "",
  category: "all",
  sort: "sheet",
  dropsOnly: false,
};

export default function App() {
  const [retryKey, setRetryKey] = useState(0);
  const { status, products, error, refreshedAt } = useSheetData(retryKey);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))],
    [products],
  );
  const latest = useMemo(
    () =>
      products
        .flatMap((product) => product.history)
        .filter((point) => point.date)
        .sort((a, b) => b.date - a.date)[0],
    [products],
  );
  const drops = useMemo(
    () => products.filter((product) => product.change !== null && product.change < 0).length,
    [products],
  );
  const visibleProducts = useMemo(
    () => filterAndSortProducts(products, filters),
    [products, filters],
  );

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <>
      <a className="skip-link" href="#price-table">
        Skip to prices
      </a>
      <SiteHeader status={status} error={error} refreshedAt={refreshedAt} />

      <main className="shell main-content">
        <SummaryStats status={status} products={products} latest={latest} drops={drops} />
        <PriceExplorer
          status={status}
          products={products}
          visibleProducts={visibleProducts}
          categories={categories}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={() => setFilters(defaultFilters)}
          onRetry={() => setRetryKey((key) => key + 1)}
          onSelectProduct={setSelectedProduct}
        />
        <DataAttribution />
      </main>

      <SiteFooter />
      <PartDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
