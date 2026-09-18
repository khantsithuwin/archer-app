import { z } from "zod";
import { parseRateMinor } from "./onboarding.ts";

export function parseProposalAmountMinor(value: string, currency: "USD" | "MMK"): number {
  const minor = parseRateMinor(value, currency);
  if (minor === null) throw new Error("Enter a proposal amount.");
  if (minor > 2_000_000_000) throw new Error("Amount exceeds the supported maximum.");
  return minor;
}

export const proposalFormSchema = z.object({
  coverLetter: z.string().trim().min(40, "Write at least 40 characters about your approach.").max(5000),
  amount: z.string(),
  currency: z.enum(["USD", "MMK"]),
  estimatedDuration: z.string().trim().max(80),
}).superRefine((value, context) => {
  try { parseProposalAmountMinor(value.amount, value.currency); }
  catch (error) { context.addIssue({ code: "custom", path: ["amount"], message: error instanceof Error ? error.message : "Enter a valid amount." }); }
});

export type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export function proposalFormPayload(values: ProposalFormValues) {
  return {
    coverLetter: values.coverLetter,
    amountMinor: parseProposalAmountMinor(values.amount, values.currency),
    estimatedDuration: values.estimatedDuration || null,
  };
}
