import assert from "node:assert/strict";
import test from "node:test";

import {
  changeClass,
  filterAndSortProducts,
  formatChange,
  parseSheet,
} from "./pricewatch.js";

test("parses categories, prices, and movement from the sheet response", () => {
  const products = parseSheet({
    status: "ok",
    table: {
      rows: [
        { c: [{ v: "Part" }, { v: "8/3" }, { v: "7/1" }, { v: "2026" }] },
        { c: [{ v: "NVIDIA GPUs" }] },
        { c: [{ v: "5070" }, { v: 40000 }, { v: 42000 }] },
      ],
    },
  });

  assert.equal(products.length, 1);
  assert.equal(products[0].name, "5070");
  assert.equal(products[0].category, "NVIDIA GPUs");
  assert.equal(products[0].current.value, 40000);
  assert.equal(products[0].previous.value, 42000);
  assert.equal(products[0].low, 40000);
  assert.equal(products[0].high, 42000);
  assert.ok(products[0].change < 0);
});

test("rejects invalid or empty sheet responses", () => {
  assert.throws(() => parseSheet({ status: "error" }), /invalid response/);
});

test("filters by brand and part type without mutating source order", () => {
  const products = [
    {
      name: "5070",
      category: "NVIDIA GPUs",
      sheetIndex: 0,
      change: 4,
      current: { value: 42000 },
    },
    {
      name: "R7 9800X3D",
      category: "AMD CPUs",
      sheetIndex: 1,
      change: -5,
      current: { value: 28000 },
    },
  ];

  const result = filterAndSortProducts(products, {
    search: "",
    brand: "amd",
    partType: "cpu",
    sort: "price-asc",
    dropsOnly: true,
  });

  assert.deepEqual(result.map((product) => product.name), ["R7 9800X3D"]);
  assert.deepEqual(products.map((product) => product.name), ["5070", "R7 9800X3D"]);
});

test("formats price movement consistently", () => {
  assert.equal(formatChange(-1.234), "-1.2%");
  assert.equal(formatChange(2), "+2.0%");
  assert.equal(changeClass(-1), "down");
  assert.equal(changeClass(0), "flat");
  assert.equal(changeClass(1), "up");
});
