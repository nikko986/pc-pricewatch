import assert from "node:assert/strict";
import test from "node:test";

import { getCategoryTheme } from "./categoryTheme.js";

test("assigns stable themes to supported PC vendors", () => {
  assert.equal(getCategoryTheme("NVIDIA GPUs"), "nvidia");
  assert.equal(getCategoryTheme("Intel CPUs"), "intel");
  assert.equal(getCategoryTheme("AMD GPUs"), "amd");
});

test("uses the default theme for unrecognised categories", () => {
  assert.equal(getCategoryTheme("Storage"), "default");
});
