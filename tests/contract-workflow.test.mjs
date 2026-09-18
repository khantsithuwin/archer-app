import assert from "node:assert/strict";
import test from "node:test";
import { completionBlocker, eventDetails, parseDeliverableUrls, reasonPayload, reviewPayload, storedDeliverableUrls, submissionPayload } from "../src/lib/contract-workflow.ts";

test("delivery links are bounded HTTP(S) URLs", () => {
  assert.deepEqual(parseDeliverableUrls("https://example.com/design\nhttp://example.com/code\n"), ["https://example.com/design", "http://example.com/code"]);
  assert.throws(() => parseDeliverableUrls("javascript:alert(1)"), /http/);
  assert.throws(() => parseDeliverableUrls(Array(21).fill("https://example.com").join("\n")), /20/);
  assert.deepEqual(storedDeliverableUrls('["https://example.com","javascript:alert(1)"]'), ["https://example.com"]);
  assert.deepEqual(storedDeliverableUrls("bad JSON"), []);
});

test("submission, review, and cancellation need meaningful notes", () => {
  assert.deepEqual(submissionPayload("  Work is ready  ", "https://example.com"), { message: "Work is ready", deliverableUrls: ["https://example.com"] });
  assert.throws(() => submissionPayload("hi", ""), /delivery note/);
  assert.deepEqual(reviewPayload("APPROVE", ""), { decision: "APPROVE", message: undefined });
  assert.throws(() => reviewPayload("REQUEST_CHANGES", "fix it"), /10 characters/);
  assert.equal(reasonPayload("  We need to stop this project  ", "cancel").reason, "We need to stop this project");
  assert.throws(() => reasonPayload("too short", "dispute"), /10/);
});

test("fixed-price completion waits for approvals and event details parse safely", () => {
  assert.match(completionBlocker("FIXED_PRICE", [{ status: "APPROVED" }, { status: "SUBMITTED" }]), /approved/);
  assert.equal(completionBlocker("FIXED_PRICE", [{ status: "APPROVED" }]), null);
  assert.equal(completionBlocker("HOURLY", []), null);
  assert.deepEqual(eventDetails('{"reason":"Scope changed"}'), { reason: "Scope changed", message: undefined });
  assert.deepEqual(eventDetails("bad JSON"), {});
});
