import { z } from "zod";

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(80),
  email: z.string().trim().pipe(z.email("Enter a valid email address.")).transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
  confirmPassword: z.string(),
  role: z.enum(["CLIENT", "FREELANCER", "BOTH"]),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export type SignUpInput = z.infer<typeof signUpSchema>;

export function registrationPayload(input: SignUpInput) {
  return {
    displayName: input.displayName,
    email: input.email,
    password: input.password,
    modes: input.role === "BOTH" ? ["CLIENT", "FREELANCER"] : [input.role],
  };
}

export const clientProfileSchema = z.object({
  isCompany: z.boolean(),
  companyName: z.string().trim().max(120),
  overview: z.string().trim().min(20, "Write at least 20 characters about your work.").max(2000),
  industry: z.string().trim().max(100),
  website: z.string().trim().refine((value) => !value || /^https?:\/\/\S+$/i.test(value) && URL.canParse(value), "Enter a full http:// or https:// URL."),
}).refine((value) => !value.isCompany || value.companyName.length >= 2, { path: ["companyName"], message: "Enter your company name." });

export type ClientProfileInput = z.infer<typeof clientProfileSchema>;

export function clientProfilePayload(input: ClientProfileInput) {
  return {
    isCompany: input.isCompany,
    companyName: input.isCompany ? input.companyName || null : null,
    overview: input.overview,
    industry: input.industry || null,
    website: input.website || null,
  };
}

export function parseRateMinor(value: string, currency: "USD" | "MMK"): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const pattern = currency === "USD" ? /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/ : /^(?:0|[1-9]\d*)$/;
  if (!pattern.test(trimmed)) throw new Error(currency === "USD" ? "Enter a positive amount with at most 2 decimal places." : "Enter a positive whole-kyat amount.");
  const [whole, fraction = ""] = trimmed.split(".");
  const minor = BigInt(whole) * (currency === "USD" ? 100n : 1n) + (currency === "USD" ? BigInt(fraction.padEnd(2, "0")) : 0n);
  if (minor <= 0n || minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Enter a positive amount within the supported range.");
  return Number(minor);
}

export function formatRateInput(minor: number | null | undefined, currency: "USD" | "MMK"): string {
  if (minor == null) return "";
  if (currency === "MMK") return String(minor);
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

export const freelancerProfileSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,30}$/, "Use 3–30 letters, numbers, underscores, or hyphens."),
  title: z.string().trim().min(2, "Add a professional title.").max(120),
  overview: z.string().trim().min(20, "Write at least 20 characters about your work.").max(4000),
  hourlyRate: z.string().trim(),
  rateCurrency: z.enum(["USD", "MMK"]),
  experienceLevel: z.enum(["ENTRY", "INTERMEDIATE", "EXPERT"]),
  availability: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]),
  skillIds: z.array(z.string()).min(1, "Choose at least one skill.").max(30),
}).superRefine((value, context) => {
  try { parseRateMinor(value.hourlyRate, value.rateCurrency); }
  catch (error) { context.addIssue({ code: "custom", path: ["hourlyRate"], message: error instanceof Error ? error.message : "Enter a valid rate." }); }
});

export type FreelancerProfileInput = z.infer<typeof freelancerProfileSchema>;

export function freelancerProfilePayload(input: FreelancerProfileInput) {
  const hourlyRateMinor = parseRateMinor(input.hourlyRate, input.rateCurrency);
  return {
    username: input.username,
    title: input.title,
    overview: input.overview,
    hourlyRateMinor,
    rateCurrency: hourlyRateMinor == null ? null : input.rateCurrency,
    experienceLevel: input.experienceLevel,
    availability: input.availability,
    skillIds: [...new Set(input.skillIds)],
  };
}
