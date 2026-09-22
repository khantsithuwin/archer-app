import { ArrowLeft, CheckCircle2, ListChecks, XCircle, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, money, type JobProposal, type OwnedJob } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { enumLabel, useI18n } from "@/i18n";

export function ProposalsPage() {
  const { locale, t, tr } = useI18n();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: job, isLoading: jobLoading, isError: jobError } = useQuery({ queryKey: ["owned-job", jobId], queryFn: async () => (await api<OwnedJob>(`/client/jobs/${jobId}`)).data, enabled: Boolean(jobId) });
  const { data: proposals, isLoading: proposalsLoading, isError: proposalsError } = useQuery({ queryKey: ["job-proposals", jobId], queryFn: async () => (await api<JobProposal[]>(`/jobs/${jobId}/proposals`)).data, enabled: Boolean(jobId) });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["job-proposals", jobId] }),
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] }),
    ]);
  };
  const decision = useMutation({ mutationFn: ({ proposalId, action }: { proposalId: string; action: "shortlist" | "reject" }) => api(`/proposals/${proposalId}/${action}`, { method: "POST", body: "{}" }), onSuccess: refresh });
  const accept = useMutation({ mutationFn: async (proposalId: string) => (await api<{ id: string }>(`/proposals/${proposalId}/accept`, { method: "POST", body: "{}" })).data, onSuccess: async (contract) => { await refresh(); navigate(`/contracts/${contract.id}`); } });

  if (jobLoading || proposalsLoading) return <section className="page-section"><div className="detail-skeleton" aria-label="Loading proposals" /></section>;
  if (jobError || proposalsError || !job) return <section className="page-section"><div className="empty-state"><h3>{tr("Proposals are unavailable")}</h3><Link to="/dashboard">{t("common.backWorkspace")}</Link></div></section>;

  return <section className="page-section narrow-page"><Link to={`/client/jobs/${job.id}`} className="back-link"><ArrowLeft size={16} /> {tr("Manage job")}</Link><div className="form-heading"><span className="eyebrow">{t("nav.clientWorkspace")}</span><h1>{tr("Review proposals.")}</h1><p>{job.title} · {t("jobs.proposals", { count: proposals?.length ?? 0 })}</p></div><div className="proposal-list">
    {proposals?.length ? proposals.map((proposal) => {
      const active = proposal.status === "SUBMITTED" || proposal.status === "SHORTLISTED";
      return <Card className="proposal-card" key={proposal.id}><div className="proposal-card-top"><div className="client-row"><span className="avatar"><UserRound size={16} /></span><span><strong>{proposal.freelancer.displayName}</strong><small>{proposal.freelancer.freelancerProfile?.title ?? tr("Independent professional")} · {proposal.freelancer.country ?? t("common.remote")}</small></span></div><Badge className={`proposal-${proposal.status.toLowerCase()}`}>{enumLabel(proposal.status, locale)}</Badge></div><p className="proposal-copy">{proposal.coverLetter}</p><div className="proposal-details"><span><small>{tr("Proposed amount")}</small><strong>{money(proposal.amountMinor, proposal.currency)}</strong></span><span><small>{tr("Timeline")}</small><strong>{proposal.estimatedDuration ?? t("common.flexible")}</strong></span></div>
        {active && <div className="proposal-decision-actions">{proposal.status === "SUBMITTED" && <Button variant="outline" disabled={decision.isPending || accept.isPending} onClick={() => decision.mutate({ proposalId: proposal.id, action: "shortlist" })}><ListChecks size={16} /> {tr("Shortlist")}</Button>}{job.status === "OPEN" && <Button disabled={decision.isPending || accept.isPending} onClick={() => accept.mutate(proposal.id)}><CheckCircle2 size={16} /> {tr("Accept")}</Button>}<Button variant="ghost" disabled={decision.isPending || accept.isPending} onClick={() => decision.mutate({ proposalId: proposal.id, action: "reject" })}><XCircle size={16} /> {tr("Reject")}</Button></div>}
        {proposal.contract && <Link className="view-all" to={`/contracts/${proposal.contract.id}`}>{tr("View contract")} <CheckCircle2 size={16} /></Link>}
      </Card>;
    }) : <Card className="empty-card"><h3>{tr("No proposals yet")}</h3><p>{tr("When freelancers apply, their proposals will appear here.")}</p></Card>}
    {(decision.isError || accept.isError) && <p className="form-error" role="alert">{decision.error?.message ?? accept.error?.message}</p>}
  </div></section>;
}
