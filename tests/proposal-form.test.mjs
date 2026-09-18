import assert from "node:assert/strict";
import test from "node:test";
import { parseProposalAmountMinor, proposalFormPayload, proposalFormSchema } from "../src/lib/proposal-form.ts";

const valid = {
  coverLetter: "I can deliver this project with accessible design, tested code, and clear updates.",
  amount: "125.05",
  currency: "USD",
  estimatedDuration: "4 weeks",
};

test("proposal amounts preserve USD cents and whole MMK kyat", () => {
  assert.equal(parseProposalAmountMinor("125.05", "USD"), 12505);
  assert.equal(parseProposalAmountMinor("250001", "MMK"), 250001);
  assert.throws(() => parseProposalAmountMinor("125.005", "USD"));
  assert.throws(() => parseProposalAmountMinor("250001.5", "MMK"));
  assert.throws(() => parseProposalAmountMinor("", "USD"));
  assert.throws(() => parseProposalAmountMinor("20000000.01", "USD"));
});

test("proposal form validates the cover letter and builds the API payload", () => {
  assert.deepEqual(proposalFormPayload(proposalFormSchema.parse(valid)), {
    coverLetter: valid.coverLetter, amountMinor: 12505, estimatedDuration: "4 weeks",
  });
  assert.equal(proposalFormSchema.safeParse({ ...valid, coverLetter: "Too short" }).success, false);
  assert.equal(proposalFormSchema.safeParse({ ...valid, amount: "1.999" }).success, false);
  assert.equal(proposalFormSchema.safeParse({ ...valid, currency: "MMK", amount: "100.50" }).success, false);
});
