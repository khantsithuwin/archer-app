import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, ExternalLink, Flag, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api, authState, money, type Contract, type ContractDetail } from "@/lib/api";
import { completionBlocker, eventDetails, reasonPayload, reviewPayload, storedDeliverableUrls, submissionPayload, type ContractDecision } from "@/lib/contract-workflow";
import { useCurrentUser } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const statusLabel = (status: string) => status.replaceAll("_", " ").toLowerCase();
const eventLabel = (type: string) => type.replaceAll("_", " ").toLowerCase();

export function ContractsPage() {
  const { data: contracts, isLoading, isError, refetch } = useQuery({ queryKey: ["my-contracts"], queryFn: async () => (await api<Contract[]>("/contracts")).data, enabled: Boolean(authState.token) });
  if (isLoading) return <section className="page-section"><div className="detail-skeleton" aria-label="Loading contracts" /></section>;
  return <section className="page-section narrow-page"><Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Workspace</Link><div className="form-heading"><span className="eyebrow">Work management</span><h1>Contracts that keep everyone aligned.</h1><p>Review agreed terms, delivery, and the next action for each engagement.</p></div>
    {isError ? <Card className="empty-card"><h3>Contracts are unavailable</h3><p>Please try loading your contracts again.</p><Button onClick={() => refetch()}>Try again</Button></Card>
      : <div className="contract-list">{contracts?.length ? contracts.map((contract) => <Link className="contract-row" to={`/contracts/${contract.id}`} key={contract.id}><span><Badge className={`status-${contract.status.toLowerCase()}`}>{statusLabel(contract.status)}</Badge><strong>{contract.job.title}</strong></span><span><strong>{contract.amountMinor != null && contract.currency ? money(contract.amountMinor, contract.currency) : "View terms"}</strong><ArrowRight size={17} /></span></Link>) : <Card className="empty-card"><h3>No contracts yet</h3><p>Accepted proposals will appear here.</p></Card>}</div>}
  </section>;
}

export function ContractDetailPage() {
  const { contractId } = useParams();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [submissionLinks, setSubmissionLinks] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<ContractDecision>("APPROVE");
  const [reviewMessage, setReviewMessage] = useState("");
  const [contractAction, setContractAction] = useState<"cancel" | "dispute" | null>(null);
  const [reason, setReason] = useState("");
  const [confirmCompletion, setConfirmCompletion] = useState(false);
  const [formError, setFormError] = useState("");
  const { data: contract, isLoading, isError, refetch } = useQuery({ queryKey: ["contract", contractId], queryFn: async () => (await api<ContractDetail>(`/contracts/${contractId}`)).data, enabled: Boolean(contractId && authState.token) });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] }),
      queryClient.invalidateQueries({ queryKey: ["my-contracts"] }),
      queryClient.invalidateQueries({ queryKey: ["my-proposals"] }),
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] }),
    ]);
  };
  const acceptMutation = useMutation({ mutationFn: () => api(`/contracts/${contractId}/accept`, { method: "POST", body: "{}" }), onSuccess: refresh });
  const submitMutation = useMutation({
    mutationFn: ({ milestoneId, payload }: { milestoneId: string; payload: ReturnType<typeof submissionPayload> }) => api(`/milestones/${milestoneId}/submit`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => { setSubmissionId(null); setSubmissionMessage(""); setSubmissionLinks(""); await refresh(); },
  });
  const reviewMutation = useMutation({
    mutationFn: ({ milestoneId, payload }: { milestoneId: string; payload: ReturnType<typeof reviewPayload> }) => api(`/milestones/${milestoneId}/review`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => { setReviewId(null); setReviewMessage(""); await refresh(); },
  });
  const completeMutation = useMutation({ mutationFn: () => api(`/contracts/${contractId}/complete`, { method: "POST", body: "{}" }), onSuccess: async () => { setConfirmCompletion(false); await refresh(); } });
  const actionMutation = useMutation({
    mutationFn: ({ action, payload }: { action: "cancel" | "dispute"; payload: ReturnType<typeof reasonPayload> }) => api(`/contracts/${contractId}/${action}`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => { setContractAction(null); setReason(""); await refresh(); },
  });

  if (isLoading || userLoading) return <section className="page-section"><div className="detail-skeleton" aria-label="Loading contract" /></section>;
  if (isError || !contract) return <section className="page-section"><div className="empty-state"><h3>Contract unavailable</h3><p>This contract could not be loaded or is not available to your account.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button><Link to="/contracts">Back to contracts</Link></div></section>;

  const isFreelancer = user?.id === contract.freelancerId;
  const isClient = user?.id === contract.clientId;
  const active = contract.status === "ACTIVE";
  const canEnd = ["PENDING_ACCEPTANCE", "ACTIVE", "COMPLETION_REQUESTED"].includes(contract.status);
  const canDispute = active || contract.status === "COMPLETION_REQUESTED";
  const completionWarning = completionBlocker(contract.workType, contract.milestones);
  const busy = acceptMutation.isPending || submitMutation.isPending || reviewMutation.isPending || completeMutation.isPending || actionMutation.isPending;
  const openSubmission = (id: string) => { submitMutation.reset(); setSubmissionId(id); setReviewId(null); setContractAction(null); setFormError(""); };
  const openReview = (id: string, decision: ContractDecision) => { reviewMutation.reset(); setReviewId(id); setReviewDecision(decision); setReviewMessage(""); setSubmissionId(null); setContractAction(null); setFormError(""); };
  const openContractAction = (action: "cancel" | "dispute") => { actionMutation.reset(); setContractAction(action); setReason(""); setSubmissionId(null); setReviewId(null); setConfirmCompletion(false); setFormError(""); };
  const sendSubmission = (event: FormEvent, milestoneId: string) => {
    event.preventDefault();
    try { submitMutation.mutate({ milestoneId, payload: submissionPayload(submissionMessage, submissionLinks) }); setFormError(""); }
    catch (error) { setFormError(error instanceof Error ? error.message : "Check your submission."); }
  };
  const sendReview = (event: FormEvent, milestoneId: string) => {
    event.preventDefault();
    try { reviewMutation.mutate({ milestoneId, payload: reviewPayload(reviewDecision, reviewMessage) }); setFormError(""); }
    catch (error) { setFormError(error instanceof Error ? error.message : "Check your feedback."); }
  };
  const sendAction = (event: FormEvent) => {
    event.preventDefault();
    if (!contractAction) return;
    try { actionMutation.mutate({ action: contractAction, payload: reasonPayload(reason, contractAction) }); setFormError(""); }
    catch (error) { setFormError(error instanceof Error ? error.message : "Check your reason."); }
  };

  return <section className="page-section narrow-page contract-detail-page"><Link to="/contracts" className="back-link"><ArrowLeft size={16} /> All contracts</Link>
    <div className="form-heading"><span className="eyebrow">{contract.workType === "FIXED_PRICE" ? "Fixed-price contract" : "Hourly contract"}</span><h1>{contract.title}</h1><p>{contract.client.displayName} and {contract.freelancer.displayName} · {money(contract.amountMinor ?? 0, contract.currency ?? "USD")}</p></div>
    <Card className="contract-summary"><div><span className="eyebrow">Current status</span><Badge className={`status-${contract.status.toLowerCase()}`}>{statusLabel(contract.status)}</Badge></div><p>These are recorded project terms. Archer does not process payments.</p></Card>

    {contract.status === "PENDING_ACCEPTANCE" && <Card className="contract-next-step"><div><span className="eyebrow">Next step</span><h2>{isFreelancer ? "Review your offer" : "Waiting for the freelancer"}</h2><p>{isFreelancer ? "Accept to begin work, or decline with a reason below." : "The freelancer needs to accept before work can be submitted."}</p></div>{isFreelancer && <Button onClick={() => acceptMutation.mutate()} disabled={busy}><CheckCircle2 size={16} /> Accept contract</Button>}</Card>}
    {canEnd && contract.status !== "PENDING_ACCEPTANCE" && <Card className="contract-next-step"><div><span className="eyebrow">Completion</span><h2>{contract.status === "COMPLETION_REQUESTED" ? "Completion requested" : "Ready to wrap up?"}</h2><p>{completionWarning ?? (isFreelancer ? contract.status === "COMPLETION_REQUESTED" ? "The client is reviewing the completion request." : "Request completion when the agreed work is finished." : "You can finalize the contract once the work is complete.")}</p></div>
      {!completionWarning && active && isFreelancer && <Button onClick={() => completeMutation.mutate()} disabled={busy}>Request completion</Button>}
      {!completionWarning && isClient && !confirmCompletion && <Button onClick={() => setConfirmCompletion(true)} disabled={busy}>{contract.status === "COMPLETION_REQUESTED" ? "Confirm completion" : "Mark complete"}</Button>}
      {!completionWarning && isClient && confirmCompletion && <div className="contract-confirm"><p>Complete this contract and close the job? This cannot be undone.</p><div><Button variant="outline" onClick={() => setConfirmCompletion(false)} disabled={busy}>Keep active</Button><Button onClick={() => completeMutation.mutate()} disabled={busy}>Complete contract</Button></div></div>}
    </Card>}
    {contract.status === "COMPLETED" && <Card className="contract-state-note"><CheckCircle2 size={19} /><p>This contract is complete. Its terms and activity remain available here.</p></Card>}
    {contract.status === "CANCELLED" && <Card className="contract-state-note"><XCircle size={19} /><p>This contract was cancelled. The job is closed and remaining milestones cannot be submitted.</p></Card>}
    {contract.status === "DISPUTED" && <Card className="contract-state-note"><Flag size={19} /><p>This contract is disputed. Work actions are paused until an administrator resolves it.</p></Card>}
    {(acceptMutation.isError || completeMutation.isError) && <p className="form-error" role="alert">{acceptMutation.error?.message ?? completeMutation.error?.message}</p>}

    <div className="milestone-heading"><div><span className="eyebrow">Delivery plan</span><h2>Milestones</h2></div><span className="muted">{contract.milestones.length} steps</span></div>
    <div className="milestone-list">{contract.milestones.length ? contract.milestones.map((milestone, index) => <Card className="milestone-card" key={milestone.id}><div className="milestone-top"><span className="milestone-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{milestone.title}</strong><small>{money(milestone.amountMinor, contract.currency ?? "USD")}</small></div><Badge className={`status-${milestone.status.toLowerCase()}`}>{statusLabel(milestone.status)}</Badge></div>{milestone.description && <p>{milestone.description}</p>}
      {milestone.submissions.map((submission) => <div className="submission-note" key={submission.id}><Clock3 size={14} /><div><small>{new Date(submission.createdAt).toLocaleString()}</small><p>{submission.message}</p>{storedDeliverableUrls(submission.deliverablesJson).map((url, linkIndex) => <a href={url} target="_blank" rel="noopener noreferrer" key={`${submission.id}-${linkIndex}`}>Deliverable {linkIndex + 1} <ExternalLink size={12} /></a>)}</div></div>)}
      {isFreelancer && active && ["PENDING", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(milestone.status) && (submissionId === milestone.id ? <form className="milestone-form" onSubmit={(event) => sendSubmission(event, milestone.id)} noValidate><label>Delivery note<textarea rows={4} value={submissionMessage} onChange={(event) => setSubmissionMessage(event.target.value)} maxLength={5000} placeholder="Tell the client what is ready for review" /></label><label>Deliverable links <span className="optional">Optional · one HTTP(S) URL per line</span><textarea rows={3} value={submissionLinks} onChange={(event) => setSubmissionLinks(event.target.value)} placeholder="https://example.com/your-work" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}{submitMutation.isError && <p className="form-error" role="alert">{submitMutation.error.message}</p>}<div className="contract-form-actions"><Button type="button" variant="outline" onClick={() => setSubmissionId(null)} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit work"}</Button></div></form> : <Button variant="outline" onClick={() => openSubmission(milestone.id)} disabled={busy}>Submit work</Button>)}
      {isClient && active && milestone.status === "SUBMITTED" && (reviewId === milestone.id ? <form className="milestone-form" onSubmit={(event) => sendReview(event, milestone.id)} noValidate><span className="eyebrow">{reviewDecision === "APPROVE" ? "Approve this delivery" : "Request changes"}</span><label>Feedback {reviewDecision === "APPROVE" ? <span className="optional">Optional</span> : null}<textarea rows={3} value={reviewMessage} onChange={(event) => setReviewMessage(event.target.value)} maxLength={2000} placeholder={reviewDecision === "APPROVE" ? "Add a note for the freelancer" : "Explain what needs to change"} /></label>{formError && <p className="form-error" role="alert">{formError}</p>}{reviewMutation.isError && <p className="form-error" role="alert">{reviewMutation.error.message}</p>}<div className="contract-form-actions"><Button type="button" variant="outline" onClick={() => setReviewId(null)} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : reviewDecision === "APPROVE" ? "Approve milestone" : "Send change request"}</Button></div></form> : <div className="milestone-actions"><Button onClick={() => openReview(milestone.id, "APPROVE")} disabled={busy}>Approve</Button><Button variant="outline" onClick={() => openReview(milestone.id, "REQUEST_CHANGES")} disabled={busy}>Request changes</Button></div>)}
    </Card>) : <Card className="empty-card"><h3>No milestones in this contract</h3><p>Hourly work can be completed without milestone approvals.</p></Card>}</div>

    {canEnd && <div className="contract-end-section"><div className="section-heading"><div><span className="eyebrow">Other actions</span><h2>Need to stop or raise an issue?</h2></div></div><p>These actions are recorded in the contract history and cannot be undone.</p><div className="contract-end-actions"><Button variant="outline" onClick={() => openContractAction("cancel")} disabled={busy}>{contract.status === "PENDING_ACCEPTANCE" ? isFreelancer ? "Decline offer" : "Cancel offer" : "Cancel contract"}</Button>{canDispute && <Button variant="ghost" onClick={() => openContractAction("dispute")} disabled={busy}><Flag size={16} /> Raise a dispute</Button>}</div>
      {contractAction && <Card className="contract-action-card"><form onSubmit={sendAction} noValidate><div><h3>{contractAction === "cancel" ? "Cancel this contract?" : "Raise a contract dispute?"}</h3><p>{contractAction === "cancel" ? "The job will close and unfinished milestones will be cancelled." : "Work actions will pause and an administrator can review your report."}</p></div><label>Reason<textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={contractAction === "cancel" ? 2000 : 3000} placeholder="Explain what happened in at least 10 characters" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}{actionMutation.isError && <p className="form-error" role="alert">{actionMutation.error.message}</p>}<div className="contract-form-actions"><Button type="button" variant="outline" onClick={() => setContractAction(null)} disabled={busy}>Keep contract</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : contractAction === "cancel" ? "Confirm cancellation" : "Submit dispute"}</Button></div></form></Card>}
    </div>}

    <div className="contract-history"><div className="section-heading"><div><span className="eyebrow">Activity history</span><h2>What happened</h2></div></div><ol>{[...contract.events].reverse().map((event) => { const detail = eventDetails(event.detailsJson); const actor = event.actorId === contract.clientId ? contract.client.displayName : event.actorId === contract.freelancerId ? contract.freelancer.displayName : "Archer"; return <li key={event.id}><span className="contract-event-dot" /><div><strong>{eventLabel(event.type)}</strong><small>{actor} · {new Date(event.createdAt).toLocaleString()}</small>{(detail.reason || detail.message) && <p>{detail.reason ?? detail.message}</p>}</div></li>; })}</ol></div>
  </section>;
}
