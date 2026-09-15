import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, money, type Job, type JobProposal } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ProposalsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: job, isLoading: jobLoading } = useQuery({ queryKey: ["job", jobId], queryFn: async () => (await api<Job>(`/jobs/${jobId}`)).data, enabled: Boolean(jobId) });
  const { data: proposals, isLoading: proposalsLoading, isError } = useQuery({ queryKey: ["job-proposals", jobId], queryFn: async () => (await api<JobProposal[]>(`/jobs/${jobId}/proposals`)).data, enabled: Boolean(jobId) });
  const acceptMutation = useMutation({ mutationFn: async (proposalId: string) => (await api<{ id: string }>(`/proposals/${proposalId}/accept`, { method: "POST", body: JSON.stringify({}) })).data, onSuccess: async (contract: { id: string }) => { await queryClient.invalidateQueries({ queryKey: ["job-proposals", jobId] }); await queryClient.invalidateQueries({ queryKey: ["my-jobs"] }); navigate(`/contracts/${contract.id}`); } });
  if (jobLoading || proposalsLoading) return <section className="page-section"><div className="detail-skeleton" /></section>;
  if (!job || isError) return <section className="page-section"><div className="empty-state"><h3>Proposals are unavailable</h3><Link to="/dashboard">Back to workspace</Link></div></section>;
  return <section className="page-section narrow-page"><Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Workspace</Link><div className="form-heading"><span className="eyebrow">Client workspace</span><h1>Review proposals.</h1><p>{job.title} · {proposals?.length ?? 0} proposals received</p></div><div className="proposal-list">{proposals?.length ? proposals.map((proposal) => <Card className="proposal-card" key={proposal.id}><div className="proposal-card-top"><div className="client-row"><span className="avatar"><UserRound size={16} /></span><span><strong>{proposal.freelancer.displayName}</strong><small>{proposal.freelancer.freelancerProfile?.title ?? "Independent professional"} · {proposal.freelancer.country ?? "Remote"}</small></span></div><Badge className={`proposal-${proposal.status.toLowerCase()}`}>{proposal.status.replace("_", " ")}</Badge></div><p className="proposal-copy">{proposal.coverLetter}</p><div className="proposal-details"><span><small>Proposed amount</small><strong>{money(proposal.amountMinor, proposal.currency)}</strong></span><span><small>Timeline</small><strong>{proposal.estimatedDuration ?? "Flexible"}</strong></span></div>{proposal.status === "SUBMITTED" || proposal.status === "SHORTLISTED" ? <Button onClick={() => acceptMutation.mutate(proposal.id)} disabled={acceptMutation.isPending}><CheckCircle2 size={16} /> {acceptMutation.isPending ? "Creating contract…" : "Accept proposal"}</Button> : proposal.contract ? <Link className="view-all" to={`/contracts/${proposal.contract.id}`}>View contract <CheckCircle2 size={16} /></Link> : null}</Card>) : <Card className="empty-card"><h3>No proposals yet</h3><p>Share the job with independent talent to start a conversation.</p></Card>}{acceptMutation.isError && <p className="form-error">{acceptMutation.error.message}</p>}</div></section>;
}
