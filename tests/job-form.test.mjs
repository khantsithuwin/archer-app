import assert from "node:assert/strict";
import test from "node:test";
import { emptyJobForm, jobFormFromJob, jobFormPayload, jobFormSchema, parseJobBudgetMinor } from "../src/lib/job-form.ts";

const valid = {
  ...emptyJobForm,
  title: "Build a research dashboard",
  description: "Create a useful research dashboard with maintainable, tested code.",
  categoryId: "cat_1",
  skillIds: ["skill_1", "skill_2"],
  budgetMin: "125.05",
  budgetMax: "250.00",
};

test("job budgets convert USD cents and whole MMK exactly", () => {
  assert.equal(parseJobBudgetMinor("125.05", "USD"), 12505);
  assert.equal(parseJobBudgetMinor("500001", "MMK"), 500001);
  assert.equal(parseJobBudgetMinor("20000000.00", "USD"), 2000000000);
  assert.equal(parseJobBudgetMinor("2000000000", "MMK"), 2000000000);
  assert.throws(() => parseJobBudgetMinor("1.001", "USD"));
  assert.throws(() => parseJobBudgetMinor("5.50", "MMK"));
  assert.throws(() => parseJobBudgetMinor("", "USD"));
  assert.throws(() => parseJobBudgetMinor("20000000.01", "USD"));
});

test("draft payload includes required work type and validated budget range", () => {
  const payload = jobFormPayload(jobFormSchema.parse(valid));
  assert.equal(payload.workType, "FIXED_PRICE");
  assert.equal(payload.budgetMinMinor, 12505);
  assert.equal(payload.budgetMaxMinor, 25000);
  assert.deepEqual(payload.skillIds, ["skill_1", "skill_2"]);
  assert.equal(jobFormSchema.safeParse({ ...valid, budgetMax: "100.00" }).success, false);
  assert.equal(jobFormSchema.safeParse({ ...valid, skillIds: [] }).success, false);
  assert.equal(jobFormSchema.safeParse({ ...valid, workType: "INVALID" }).success, false);
});

test("owned drafts prefill the edit form without changing stored money", () => {
  const draft = {
    id: "job_1", title: valid.title, description: valid.description, categoryId: valid.categoryId,
    skills: [{ skillId: "skill_1", skill: { id: "skill_1", name: "Design", slug: "design" } }],
    workType: "HOURLY", currency: "USD", budgetMinMinor: 12505, budgetMaxMinor: 25000,
    experienceLevel: "INTERMEDIATE", estimatedDuration: null,
  };
  const form = jobFormFromJob(draft);
  assert.equal(form.budgetMin, "125.05");
  assert.equal(form.budgetMax, "250.00");
  assert.equal(form.workType, "HOURLY");
  assert.deepEqual(form.skillIds, ["skill_1"]);
});
