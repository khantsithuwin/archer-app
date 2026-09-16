import assert from "node:assert/strict";
import test from "node:test";
import { clientProfilePayload, clientProfileSchema, formatRateInput, freelancerProfilePayload, freelancerProfileSchema, parseRateMinor, registrationPayload, signUpSchema } from "../src/lib/onboarding.ts";

test("registration requires matching passwords and maps the both-role choice", () => {
  const input = { displayName: "Alex Lee", email: "ALEX@example.com", password: "longpassword", confirmPassword: "longpassword", role: "BOTH" };
  const parsed = signUpSchema.parse(input);
  assert.deepEqual(registrationPayload(parsed), { displayName: "Alex Lee", email: "alex@example.com", password: "longpassword", modes: ["CLIENT", "FREELANCER"] });
  assert.equal(signUpSchema.safeParse({ ...input, confirmPassword: "different" }).success, false);
  assert.equal(signUpSchema.safeParse({ ...input, email: "not-an-email" }).success, false);
  assert.equal(signUpSchema.parse({ ...input, email: " ALEX@example.com " }).email, "alex@example.com");
});

test("client profile requires a meaningful overview and company name when relevant", () => {
  const input = { isCompany: true, companyName: "North Studio", overview: "We build useful digital products for local teams.", industry: "Design", website: "https://example.com" };
  assert.deepEqual(clientProfilePayload(clientProfileSchema.parse(input)), input);
  assert.equal(clientProfileSchema.safeParse({ ...input, companyName: "" }).success, false);
  assert.equal(clientProfileSchema.safeParse({ ...input, website: "javascript:alert(1)" }).success, false);
});

test("hourly rates use exact USD cents and whole MMK without floating point conversion", () => {
  assert.equal(parseRateMinor("42.05", "USD"), 4205);
  assert.equal(parseRateMinor("25000", "MMK"), 25000);
  assert.equal(parseRateMinor("", "USD"), null);
  assert.equal(formatRateInput(4205, "USD"), "42.05");
  assert.equal(formatRateInput(25000, "MMK"), "25000");
  assert.throws(() => parseRateMinor("42.005", "USD"));
  assert.throws(() => parseRateMinor("25000.5", "MMK"));
  assert.throws(() => parseRateMinor("0", "USD"));
  assert.throws(() => parseRateMinor("999999999999999999", "MMK"));
});

test("freelancer profile validates skills and builds API payload", () => {
  const input = { username: "Alex_Lee", title: "Product designer", overview: "I design thoughtful products and clear user experiences.", hourlyRate: "42.05", rateCurrency: "USD", experienceLevel: "INTERMEDIATE", availability: "AVAILABLE", skillIds: ["skill_1", "skill_1", "skill_2"] };
  const parsed = freelancerProfileSchema.parse(input);
  assert.deepEqual(freelancerProfilePayload(parsed), { username: "alex_lee", title: input.title, overview: input.overview, hourlyRateMinor: 4205, rateCurrency: "USD", experienceLevel: "INTERMEDIATE", availability: "AVAILABLE", skillIds: ["skill_1", "skill_2"] });
  assert.equal(freelancerProfileSchema.safeParse({ ...input, skillIds: [] }).success, false);
  assert.equal(freelancerProfileSchema.safeParse({ ...input, hourlyRate: "1.999" }).success, false);
});
