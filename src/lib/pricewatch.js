export const peso = new Intl.NumberFormat("en-PH", {
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

export function parseSheet(response) {
  if (!response || response.status !== "ok" || !response.table?.rows?.length) {
    const message =
      response?.errors?.[0]?.detailed_message || "The sheet returned an invalid response.";
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

export function formatChange(value) {
  if (value === null || !Number.isFinite(value)) return "No prior data";
  if (Math.abs(value) < 0.005) return "0.0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function changeClass(value) {
  if (value === null || Math.abs(value) < 0.005) return "flat";
  return value < 0 ? "down" : "up";
}

export function filterAndSortProducts(products, filters) {
  const query = filters.search.trim().toLocaleLowerCase();

  return products
    .filter((product) => {
      const matchesQuery =
        !query || `${product.name} ${product.category}`.toLocaleLowerCase().includes(query);
      const matchesCategory =
        filters.category === "all" || product.category === filters.category;
      const matchesDrop = !filters.dropsOnly || (product.change !== null && product.change < 0);
      return matchesQuery && matchesCategory && matchesDrop;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "price-asc":
          return a.current.value - b.current.value;
        case "price-desc":
          return b.current.value - a.current.value;
        case "drop":
          return (a.change ?? Infinity) - (b.change ?? Infinity);
        case "name":
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        default:
          return a.sheetIndex - b.sheetIndex;
      }
    });
}
