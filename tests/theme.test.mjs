import assert from "node:assert/strict";
import test from "node:test";
import { applyTheme, resolveTheme } from "../src/theme/core.ts";

test("saved theme takes precedence over the operating-system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("theme defaults to the operating-system preference", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
  assert.equal(resolveTheme("unsupported", true), "dark");
});

test("applying a theme updates both the theme hook and native color scheme", () => {
  const root = { dataset: {}, style: { colorScheme: "" } };
  applyTheme(root, "dark");
  assert.deepEqual(root, { dataset: { theme: "dark" }, style: { colorScheme: "dark" } });
});
