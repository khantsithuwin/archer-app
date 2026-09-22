import assert from "node:assert/strict";
import test from "node:test";
import { applyDocumentLocale, firstGrapheme, interpolate, resolveLocale } from "../src/i18n/core.ts";

test("saved locale wins and Myanmar browser locales default to Burmese", () => {
  assert.equal(resolveLocale("en", "my-MM"), "en");
  assert.equal(resolveLocale("my", "en-US"), "my");
  assert.equal(resolveLocale(null, "my-MM"), "my");
  assert.equal(resolveLocale(null, "en-US"), "en");
});

test("translation interpolation replaces repeated variables without changing Myanmar text", () => {
  assert.equal(interpolate("မင်္ဂလာပါ {name}၊ {name}။", { name: "မြတ်နိုး" }), "မင်္ဂလာပါ မြတ်နိုး၊ မြတ်နိုး။");
});

test("avatar initials preserve a complete Myanmar grapheme cluster", () => {
  assert.equal(firstGrapheme(" မြတ်နိုး ", "my"), "မြ");
  assert.equal(firstGrapheme("Alex", "en"), "A");
});

test("document locale metadata remains LTR for Burmese and exposes the active locale", () => {
  const root = { lang: "", dir: "", dataset: {} };
  applyDocumentLocale(root, "my");
  assert.deepEqual(root, { lang: "my", dir: "ltr", dataset: { locale: "my" } });
});
