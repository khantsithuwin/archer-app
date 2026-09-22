import { getLocale } from "@/i18n";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };
export type ApiError = { error?: { code?: string; message?: string; fields?: Record<string, string[]> } };

let accessToken = localStorage.getItem("archer_access_token");
export const authState = { get token() { return accessToken; }, set token(value: string | null) { accessToken = value; if (value) localStorage.setItem("archer_access_token", value); else localStorage.removeItem("archer_access_token"); } };

export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept-Language", getLocale());
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 204) return { data: undefined as T };
  const body = await response.json() as ApiEnvelope<T> & ApiError;
  if (!response.ok) throw new Error(body.error?.message ?? "Something went wrong. Please try again.");
  return body;
}

export type ClientProfile = { companyName?: string | null; overview?: string | null; industry?: string | null; website?: string | null; isCompany: boolean };
export type FreelancerProfile = { username: string; title: string; overview: string; hourlyRateMinor?: number | null; rateCurrency?: "USD" | "MMK" | null; experienceLevel: "ENTRY" | "INTERMEDIATE" | "EXPERT"; availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE"; skills?: { skillId: string; skill: { id: string; name: string } }[] };
export type User = { id: string; email: string; displayName: string; avatarUrl?: string | null; modes: string[]; clientProfile?: ClientProfile | null; freelancerProfile?: FreelancerProfile | null };
export function normalizeUser(user: Omit<User, "modes"> & { modes: (string | { mode: string })[] }): User { return { ...user, modes: user.modes.map((mode) => typeof mode === "string" ? mode : mode.mode) }; }
export type Category = { id: string; name: string; slug: string; skills: { id: string; name: string; slug: string }[] };
export type Job = { id: string; title: string; description: string; workType: "FIXED_PRICE" | "HOURLY"; currency: "USD" | "MMK"; budgetMinMinor: number; budgetMaxMinor: number; experienceLevel: string; status?: string; estimatedDuration?: string | null; publishedAt: string; category: Category; skills: { skill: { name: string; slug: string } }[]; client: { id: string; displayName: string; country?: string | null }; _count?: { proposals: number } };
export type OwnedJob = Omit<Job, "budgetMinMinor" | "budgetMaxMinor" | "experienceLevel" | "status" | "publishedAt" | "skills" | "client"> & { categoryId: string; budgetMinMinor: number | null; budgetMaxMinor: number | null; experienceLevel: "ENTRY" | "INTERMEDIATE" | "EXPERT"; status: "DRAFT" | "OPEN" | "PAUSED" | "CLOSED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "HIDDEN"; publishedAt: string | null; skills: { skillId: string; skill: { id: string; name: string; slug: string } }[]; _count: { proposals: number } };
export type Proposal = { id: string; status: string; coverLetter: string; amountMinor: number; currency: "USD" | "MMK"; estimatedDuration?: string | null; job: Pick<Job, "id" | "title" | "currency" | "budgetMinMinor" | "budgetMaxMinor">; contract?: { id: string; status: string } | null };
export type JobProposal = Omit<Proposal, "job"> & { freelancer: { id: string; displayName: string; avatarUrl?: string | null; country?: string | null; freelancerProfile?: { title?: string | null; hourlyRateMinor?: number | null } | null }; milestones?: { id: string; title: string; amountMinor: number }[] };
export type Contract = { id: string; status: string; job: Pick<Job, "id" | "title">; clientId?: string; freelancerId?: string; amountMinor?: number; currency?: "USD" | "MMK" };
export type ContractDetail = Contract & { title: string; workType: "FIXED_PRICE" | "HOURLY"; client: { id: string; displayName: string }; freelancer: { id: string; displayName: string }; milestones: { id: string; title: string; description?: string | null; amountMinor: number; status: string; submissions: { id: string; message: string; deliverablesJson: string; createdAt: string }[] }[]; events: { id: string; actorId: string; type: string; detailsJson: string; createdAt: string }[] };

export const money = (minor: number, currency: "USD" | "MMK") => new Intl.NumberFormat(getLocale() === "my" ? "my-MM" : "en-US", { style: "currency", currency, minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(currency === "USD" ? minor / 100 : minor);
