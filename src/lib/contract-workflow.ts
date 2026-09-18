export type ContractDecision = "APPROVE" | "REQUEST_CHANGES";

function isHttpUrl(value: string): boolean {
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
}

export function parseDeliverableUrls(input: string): string[] {
  const urls = input.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  if (urls.length > 20) throw new Error("Add no more than 20 deliverable links.");
  if (urls.some((value) => !isHttpUrl(value))) throw new Error("Each deliverable link must start with http:// or https://.");
  return urls;
}

export function storedDeliverableUrls(json: string): string[] {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && isHttpUrl(item)) : [];
  } catch { return []; }
}

export function submissionPayload(message: string, links: string) {
  const trimmed = message.trim();
  if (trimmed.length < 3 || trimmed.length > 5000) throw new Error("Write a delivery note between 3 and 5,000 characters.");
  return { message: trimmed, deliverableUrls: parseDeliverableUrls(links) };
}

export function reviewPayload(decision: ContractDecision, message: string) {
  const trimmed = message.trim();
  if (trimmed.length > 2000) throw new Error("Feedback must be 2,000 characters or fewer.");
  if (decision === "REQUEST_CHANGES" && trimmed.length < 10) throw new Error("Explain the requested changes in at least 10 characters.");
  return { decision, message: trimmed || undefined };
}

export function reasonPayload(reason: string, action: "cancel" | "dispute") {
  const trimmed = reason.trim();
  const maximum = action === "cancel" ? 2000 : 3000;
  if (trimmed.length < 10 || trimmed.length > maximum) throw new Error(`Give a reason between 10 and ${maximum.toLocaleString("en-US")} characters.`);
  return { reason: trimmed };
}

export function completionBlocker(workType: "FIXED_PRICE" | "HOURLY", milestones: { status: string }[]): string | null {
  return workType === "FIXED_PRICE" && milestones.some((milestone) => milestone.status !== "APPROVED") ? "All milestones must be approved before this contract can be completed." : null;
}

export function eventDetails(json: string): { reason?: string; message?: string } {
  try {
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== "object") return {};
    const details = value as Record<string, unknown>;
    return { reason: typeof details.reason === "string" ? details.reason : undefined, message: typeof details.message === "string" ? details.message : undefined };
  } catch { return {}; }
}
