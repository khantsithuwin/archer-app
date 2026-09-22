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
import { enumLabel, useI18n } from "@/i18n";

export function JobDetailPage() {
  const { locale, t, tr } = useI18n();
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

  if (isLoading) return <section className="page-section"><div className="detail-skeleton" aria-label={t("jobs.detailLoading")} /></section>;
  if (isError || !job) return <section className="page-section"><div className="empty-state"><h3>{t("jobs.notFound")}</h3><Link to="/jobs">{t("jobs.back")}</Link></div></section>;

  const isOwnJob = user?.id === job.client.id;
  const canShowForm = isFreelancer && !isOwnJob && Boolean(user?.freelancerProfile) && job.status === "OPEN" && !existingProposal && !proposalsError && !proposalsLoading;

  return <section className="page-section"><Link to="/jobs" className="back-link"><ArrowLeft size={16} /> {tr("All opportunities")}</Link><div className="detail-layout"><article><div className="detail-eyebrow"><Badge>{job.workType === "FIXED_PRICE" ? t("common.fixedPrice") : t("common.hourly")}</Badge><span>{job.category.name}</span></div><h1>{job.title}</h1><div className="job-meta detail-meta"><span><Clock3 size={15} /> {job.estimatedDuration ?? t("common.flexible")}</span><span><MapPin size={15} /> {job.client.country ?? t("common.remote")}</span><span><CalendarDays size={15} /> {tr("Posted recently")}</span></div><div className="prose"><h3>{tr("About the project")}</h3><p>{job.description}</p></div><div className="job-tags detail-tags">{job.skills.map(({ skill }) => <span key={skill.slug}>{skill.name}</span>)}</div></article><aside className="apply-panel"><Card><span className="eyebrow">{tr("Project budget")}</span><strong className="budget">{money(job.budgetMinMinor, job.currency)} – {money(job.budgetMaxMinor, job.currency)}</strong><span className="muted">{job.currency} · {enumLabel(job.experienceLevel, locale)}</span>
    {isOwnJob ? <Link className="button button-wide" to={`/client/jobs/${job.id}`}>{tr("Manage your job")}</Link>
      : existingProposal ? <Link className="button button-wide" to={`/proposals/${existingProposal.id}`}>{tr("View your proposal")}</Link>
      : !isFreelancer ? <p className="proposal-notice">{tr("Use a freelancer account to submit a proposal.")}</p>
      : !user?.freelancerProfile ? <Link className="button button-wide" to="/onboarding">{tr("Complete freelancer profile")}</Link>
      : job.status !== "OPEN" ? <p className="proposal-notice">{tr("This job is not accepting new proposals.")}</p>
      : proposalsLoading ? <p className="proposal-notice">{tr("Checking your proposals…")}</p>
      : proposalsError ? <div className="proposal-notice">{tr("Could not check your proposals.")} <button type="button" onClick={() => refetchProposals()}>{t("common.tryAgain")}</button></div>
      : <Button className="button-wide" onClick={() => setShowProposalForm(true)}><Send size={16} /> {tr("Submit a proposal")}</Button>}
    <p className="fine-print"><ShieldCheck size={14} /> {tr("Your proposal stays private to this client.")}</p></Card>
    {showProposalForm && canShowForm && <ProposalForm initial={{ coverLetter: "", amount: formatRateInput(job.budgetMinMinor, job.currency), currency: job.currency, estimatedDuration: job.estimatedDuration ?? "" }} title={tr("Make a thoughtful case")} submitLabel={tr("Send proposal")} busy={proposalMutation.isPending} error={proposalMutation.error?.message} onSave={(payload) => proposalMutation.mutate(payload)} onCancel={() => setShowProposalForm(false)} />}
    <Card className="client-card"><span className="eyebrow">{tr("About the client")}</span><div className="client-row"><span className="avatar">{job.client.displayName.slice(0, 1)}</span><span><strong>{job.client.displayName}</strong><small>{job.client.country ?? t("common.remote")}</small></span></div></Card>
  </aside></div></section>;
}
