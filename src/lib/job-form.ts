import { z } from "zod";
import { formatRateInput, parseRateMinor } from "./onboarding.ts";
import type { OwnedJob } from "./api";

export type JobCurrency = "USD" | "MMK";
export const maxJobBudgetMinor = 2_000_000_000;

export function parseJobBudgetMinor(value: string, currency: JobCurrency): number {
  const minor = parseRateMinor(value, currency);
  if (minor === null) throw new Error("Enter a budget amount.");
  if (minor > maxJobBudgetMinor) throw new Error("Budget exceeds the supported maximum.");
  return minor;
}

export const jobFormSchema = z.object({
  title: z.string().trim().min(8, "Use at least 8 characters.").max(150),
  description: z.string().trim().min(40, "Describe the project in at least 40 characters.").max(20_000),
  categoryId: z.string().min(1, "Choose a category."),
  skillIds: z.array(z.string()).min(1, "Choose at least one skill.").max(20, "Choose no more than 20 skills."),
  workType: z.enum(["FIXED_PRICE", "HOURLY"]),
  currency: z.enum(["USD", "MMK"]),
  budgetMin: z.string(),
  budgetMax: z.string(),
  experienceLevel: z.enum(["ENTRY", "INTERMEDIATE", "EXPERT"]),
  estimatedDuration: z.string().trim().max(80),
}).superRefine((value, context) => {
  let minimum: number | undefined;
  let maximum: number | undefined;
  try { minimum = parseJobBudgetMinor(value.budgetMin, value.currency); }
  catch (error) { context.addIssue({ code: "custom", path: ["budgetMin"], message: error instanceof Error ? error.message : "Enter a valid budget." }); }
  try { maximum = parseJobBudgetMinor(value.budgetMax, value.currency); }
  catch (error) { context.addIssue({ code: "custom", path: ["budgetMax"], message: error instanceof Error ? error.message : "Enter a valid budget." }); }
  if (minimum !== undefined && maximum !== undefined && maximum < minimum) context.addIssue({ code: "custom", path: ["budgetMax"], message: "Maximum budget must be at least the minimum." });
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

export const emptyJobForm: JobFormValues = {
  title: "", description: "", categoryId: "", skillIds: [], workType: "FIXED_PRICE", currency: "USD",
  budgetMin: "", budgetMax: "", experienceLevel: "INTERMEDIATE", estimatedDuration: "",
};

export function jobFormFromJob(job: OwnedJob): JobFormValues {
  return {
    title: job.title, description: job.description, categoryId: job.categoryId,
    skillIds: job.skills.map(({ skill }) => skill.id), workType: job.workType, currency: job.currency,
    budgetMin: formatRateInput(job.budgetMinMinor, job.currency),
    budgetMax: formatRateInput(job.budgetMaxMinor, job.currency),
    experienceLevel: job.experienceLevel, estimatedDuration: job.estimatedDuration ?? "",
  };
}

export function jobFormPayload(values: JobFormValues) {
  return {
    title: values.title, description: values.description, categoryId: values.categoryId,
    skillIds: [...new Set(values.skillIds)], workType: values.workType, currency: values.currency,
    budgetMinMinor: parseJobBudgetMinor(values.budgetMin, values.currency),
    budgetMaxMinor: parseJobBudgetMinor(values.budgetMax, values.currency),
    experienceLevel: values.experienceLevel, estimatedDuration: values.estimatedDuration || null,
  };
}
