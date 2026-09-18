import { ArrowLeft, CalendarDays, Clock3, MapPin, Send, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, money, type Job, type Proposal } from "@/lib/api";
import { formatRateInput } from "@/lib/onboarding";
import type { proposalFormPayload } from "@/lib/proposal-form";
import { useCurrentUser } from "@/components/layout";
import { ProposalForm } from "@/components/proposal-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const { data: job, isLoading, isError } = useQuery({ queryKey: ["job", jobId], queryFn: async () => (await api<Job>(`/jobs/${jobId}`)).data, enabled: Boolean(jobId) });
  const isFreelancer = Boolean(user?.modes.includes("FREELANCER"));
  const { data: myProposals, isLoading: proposalsLoading, isError: proposalsError, refetch: refetchProposals } = useQuery({
    queryKey: ["my-proposals"], queryFn: async () => (await api<Proposal[]>("/proposals")).data, enabled: isFreelancer,
  });
  const existingProposal = myProposals?.find((proposal) => proposal.job.id === jobId);
  const proposalMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof proposalFormPayload>) => (await api<{ id: string }>(`/jobs/${jobId}/proposals`, { method: "POST", body: JSON.stringify({ ...payload, milestones: [] }) })).data,
    onSuccess: async (proposal) => {
      await queryClient.invalidateQueries({ queryKey: ["my-proposals"] });
      navigate(`/proposals/${proposal.id}`);
    },
  });

  if (isLoading) return <section className="page-section"><div className="detail-skeleton" aria-label="Loading job" /></section>;
  if (isError || !job) return <section className="page-section"><div className="empty-state"><h3>That job could not be found</h3><Link to="/jobs">Back to jobs</Link></div></section>;

  const isOwnJob = user?.id === job.client.id;
  const canShowForm = isFreelancer && !isOwnJob && Boolean(user?.freelancerProfile) && job.status === "OPEN" && !existingProposal && !proposalsError && !proposalsLoading;

  return <section className="page-section"><Link to="/jobs" className="back-link"><ArrowLeft size={16} /> All opportunities</Link><div className="detail-layout"><article><div className="detail-eyebrow"><Badge>{job.workType === "FIXED_PRICE" ? "Fixed price" : "Hourly"}</Badge><span>{job.category.name}</span></div><h1>{job.title}</h1><div className="job-meta detail-meta"><span><Clock3 size={15} /> {job.estimatedDuration ?? "Flexible"}</span><span><MapPin size={15} /> {job.client.country ?? "Remote"}</span><span><CalendarDays size={15} /> Posted recently</span></div><div className="prose"><h3>About the project</h3><p>{job.description}</p></div><div className="job-tags detail-tags">{job.skills.map(({ skill }) => <span key={skill.slug}>{skill.name}</span>)}</div></article><aside className="apply-panel"><Card><span className="eyebrow">Project budget</span><strong className="budget">{money(job.budgetMinMinor, job.currency)} – {money(job.budgetMaxMinor, job.currency)}</strong><span className="muted">{job.currency} · {job.experienceLevel.toLowerCase()} level</span>
    {isOwnJob ? <Link className="button button-wide" to={`/client/jobs/${job.id}`}>Manage your job</Link>
      : existingProposal ? <Link className="button button-wide" to={`/proposals/${existingProposal.id}`}>View your proposal</Link>
      : !isFreelancer ? <p className="proposal-notice">Use a freelancer account to submit a proposal.</p>
      : !user?.freelancerProfile ? <Link className="button button-wide" to="/onboarding">Complete freelancer profile</Link>
      : job.status !== "OPEN" ? <p className="proposal-notice">This job is not accepting new proposals.</p>
      : proposalsLoading ? <p className="proposal-notice">Checking your proposals…</p>
      : proposalsError ? <div className="proposal-notice">Could not check your proposals. <button type="button" onClick={() => refetchProposals()}>Try again</button></div>
      : <Button className="button-wide" onClick={() => setShowProposalForm(true)}><Send size={16} /> Submit a proposal</Button>}
    <p className="fine-print"><ShieldCheck size={14} /> Your proposal stays private to this client.</p></Card>
    {showProposalForm && canShowForm && <ProposalForm initial={{ coverLetter: "", amount: formatRateInput(job.budgetMinMinor, job.currency), currency: job.currency, estimatedDuration: job.estimatedDuration ?? "" }} title="Make a thoughtful case" submitLabel="Send proposal" busy={proposalMutation.isPending} error={proposalMutation.error?.message} onSave={(payload) => proposalMutation.mutate(payload)} onCancel={() => setShowProposalForm(false)} />}
    <Card className="client-card"><span className="eyebrow">About the client</span><div className="client-row"><span className="avatar">{job.client.displayName.slice(0, 1)}</span><span><strong>{job.client.displayName}</strong><small>{job.client.country ?? "Remote"}</small></span></div></Card>
  </aside></div></section>;
}
