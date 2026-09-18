import { ArrowLeft, ArrowRight, FileText, Pencil, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/layout";
import { ProposalForm } from "@/components/proposal-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, money, type Proposal } from "@/lib/api";
import { formatRateInput } from "@/lib/onboarding";
import type { proposalFormPayload } from "@/lib/proposal-form";

export function MyProposalPage() {
  const { proposalId } = useParams();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const isFreelancer = Boolean(user?.modes.includes("FREELANCER"));
  const { data: proposal, isLoading, isError } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => (await api<Proposal>(`/proposals/${proposalId}`)).data,
    enabled: Boolean(proposalId && isFreelancer),
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] }),
      queryClient.invalidateQueries({ queryKey: ["my-proposals"] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (payload: ReturnType<typeof proposalFormPayload>) => api(`/proposals/${proposalId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: async () => { await refresh(); setEditing(false); },
  });
  const withdraw = useMutation({
    mutationFn: () => api(`/proposals/${proposalId}/withdraw`, { method: "POST", body: "{}" }),
    onSuccess: async () => { await refresh(); setConfirmWithdraw(false); },
  });

  if (!isFreelancer) return <section className="page-section narrow-page"><div className="empty-card"><h1>Freelancer access required</h1><Link className="button" to="/dashboard">Back to workspace</Link></div></section>;
  if (isLoading) return <section className="page-section narrow-page"><div className="detail-skeleton" aria-label="Loading proposal" /></section>;
  if (isError || !proposal) return <section className="page-section narrow-page"><div className="empty-card"><h1>Proposal unavailable</h1><p>This proposal could not be found in your account.</p><Link className="button" to="/dashboard">Back to workspace</Link></div></section>;

  const canChange = ["SUBMITTED", "SHORTLISTED"].includes(proposal.status);
  return <section className="page-section narrow-page my-proposal-page"><Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to workspace</Link><div className="form-heading"><span className="eyebrow">Your application</span><h1>{proposal.job.title}</h1><p>Keep your proposal details and status in one place.</p></div>
    <Card className="my-proposal-summary"><div className="my-proposal-status"><Badge className={`status-${proposal.status.toLowerCase()}`}>{proposal.status.replaceAll("_", " ")}</Badge><span>{proposal.currency}</span></div><div className="proposal-details"><span><small>Proposed amount</small><strong>{money(proposal.amountMinor, proposal.currency)}</strong></span><span><small>Estimated duration</small><strong>{proposal.estimatedDuration ?? "Flexible"}</strong></span></div><div className="my-proposal-letter"><span className="eyebrow">Your approach</span><p>{proposal.coverLetter}</p></div></Card>
    {!editing && <div className="my-proposal-actions">{canChange && <Button variant="outline" onClick={() => setEditing(true)}><Pencil size={16} /> Edit proposal</Button>}{proposal.contract && <Link className="button" to={`/contracts/${proposal.contract.id}`}><FileText size={16} /> View contract</Link>}<Link className="button button-outline" to={`/jobs/${proposal.job.id}`}>View job <ArrowRight size={16} /></Link>{canChange && !confirmWithdraw && <Button variant="ghost" onClick={() => setConfirmWithdraw(true)}><XCircle size={16} /> Withdraw</Button>}</div>}
    {confirmWithdraw && <Card className="client-job-confirm"><div><strong>Withdraw this proposal?</strong><p>The client will no longer be able to accept it. You cannot submit another proposal to the same job.</p></div><div><Button variant="outline" onClick={() => setConfirmWithdraw(false)}>Keep proposal</Button><Button onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>{withdraw.isPending ? "Withdrawing…" : "Withdraw proposal"}</Button></div></Card>}
    {withdraw.isError && <p className="form-error" role="alert">{withdraw.error.message}</p>}
    {editing && <div className="my-proposal-edit"><ProposalForm key={proposal.id} initial={{ coverLetter: proposal.coverLetter, amount: formatRateInput(proposal.amountMinor, proposal.currency), currency: proposal.currency, estimatedDuration: proposal.estimatedDuration ?? "" }} title="Refine your proposal" submitLabel="Save changes" busy={save.isPending} error={save.error?.message} onSave={(payload) => save.mutate(payload)} onCancel={() => setEditing(false)} /></div>}
  </section>;
}
