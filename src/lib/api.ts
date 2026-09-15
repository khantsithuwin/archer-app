const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };
export type ApiError = { error?: { code?: string; message?: string; fields?: Record<string, string[]> } };

let accessToken = localStorage.getItem("archer_access_token");
export const authState = { get token() { return accessToken; }, set token(value: string | null) { accessToken = value; if (value) localStorage.setItem("archer_access_token", value); else localStorage.removeItem("archer_access_token"); } };

export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 204) return { data: undefined as T };
  const body = await response.json() as ApiEnvelope<T> & ApiError;
  if (!response.ok) throw new Error(body.error?.message ?? "Something went wrong. Please try again.");
  return body;
}

export type User = { id: string; email: string; displayName: string; avatarUrl?: string | null; modes: string[]; clientProfile?: unknown; freelancerProfile?: unknown };
export function normalizeUser(user: Omit<User, "modes"> & { modes: (string | { mode: string })[] }): User { return { ...user, modes: user.modes.map((mode) => typeof mode === "string" ? mode : mode.mode) }; }
export type Category = { id: string; name: string; slug: string; skills: { id: string; name: string; slug: string }[] };
export type Job = { id: string; title: string; description: string; workType: "FIXED_PRICE" | "HOURLY"; currency: "USD" | "MMK"; budgetMinMinor: number; budgetMaxMinor: number; experienceLevel: string; status?: string; estimatedDuration?: string | null; publishedAt: string; category: Category; skills: { skill: { name: string; slug: string } }[]; client: { displayName: string; country?: string | null }; _count?: { proposals: number } };
export type Proposal = { id: string; status: string; amountMinor: number; currency: "USD" | "MMK"; job: Pick<Job, "id" | "title" | "currency" | "budgetMinMinor" | "budgetMaxMinor">; contract?: { id: string; status: string } | null };
export type JobProposal = Proposal & { coverLetter: string; estimatedDuration?: string | null; freelancer: { id: string; displayName: string; avatarUrl?: string | null; country?: string | null; freelancerProfile?: { title?: string | null; hourlyRateMinor?: number | null } | null }; milestones?: { id: string; title: string; amountMinor: number }[] };
export type Contract = { id: string; status: string; job: Pick<Job, "id" | "title">; clientId?: string; freelancerId?: string; amountMinor?: number; currency?: "USD" | "MMK" };
export type ContractDetail = Contract & { title: string; workType: "FIXED_PRICE" | "HOURLY"; client: { id: string; displayName: string }; freelancer: { id: string; displayName: string }; milestones: { id: string; title: string; description?: string | null; amountMinor: number; status: string; submissions?: { id: string; message: string; createdAt: string }[] }[]; events?: { id: string; type: string; createdAt: string }[] };

export const money = (minor: number, currency: "USD" | "MMK") => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(currency === "USD" ? minor / 100 : minor);
