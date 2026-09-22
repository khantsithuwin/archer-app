import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileText, Pencil, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/layout";
import { JobForm } from "@/components/job-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, money, type OwnedJob } from "@/lib/api";
import { jobFormFromJob, type jobFormPayload } from "@/lib/job-form";
import { enumLabel, useI18n } from "@/i18n";

export function ClientJobPage() {
  const { locale, t, tr } = useI18n();
  const { jobId } = useParams();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const isClient = Boolean(user?.modes.includes("CLIENT"));
  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["owned-job", jobId],
    queryFn: async () => (await api<OwnedJob>(`/client/jobs/${jobId}`)).data,
    enabled: Boolean(jobId && isClient),
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["owned-job", jobId] }),
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] }),
      queryClient.invalidateQueries({ queryKey: ["job", jobId] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (payload: ReturnType<typeof jobFormPayload>) => api(`/jobs/${jobId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: async () => { await refresh(); setEditing(false); },
  });
  const publish = useMutation({ mutationFn: () => api(`/jobs/${jobId}/publish`, { method: "POST", body: "{}" }), onSuccess: refresh });
  const close = useMutation({ mutationFn: () => api(`/jobs/${jobId}/close`, { method: "POST", body: "{}" }), onSuccess: async () => { await refresh(); setConfirmClose(false); } });

  if (!isClient) return <section className="page-section narrow-page"><div className="empty-card"><h1>{tr("Client access required")}</h1><p>{tr("Only client accounts can manage jobs.")}</p><Link className="button" to="/dashboard">{t("common.backWorkspace")}</Link></div></section>;
  if (isLoading) return <section className="page-section narrow-page"><div className="detail-skeleton" aria-label={t("jobs.detailLoading")} /></section>;
  if (isError || !job) return <section className="page-section narrow-page"><div className="empty-card"><h1>{tr("Job unavailable")}</h1><p>{tr("This job could not be found in your client workspace.")}</p><Link className="button" to="/dashboard">{t("common.backWorkspace")}</Link></div></section>;

  const canEdit = ["DRAFT", "OPEN", "PAUSED"].includes(job.status) && job._count.proposals === 0;
  const canPublish = job.status === "DRAFT" || job.status === "PAUSED";
  const canClose = job.status === "OPEN" || job.status === "PAUSED";
  const budget = job.budgetMinMinor != null && job.budgetMaxMinor != null ? `${money(job.budgetMinMinor, job.currency)} – ${money(job.budgetMaxMinor, job.currency)}` : tr("Budget not set");

  return <section className="page-section narrow-page client-job-page">
    <Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> {t("common.backWorkspace")}</Link>
    <div className="form-heading"><span className="eyebrow">{t("nav.clientWorkspace")}</span><h1>{job.title}</h1><p>{tr("Manage the brief, visibility, and proposals for this opportunity.")}</p></div>
    <Card className="client-job-overview">
      <div className="client-job-overview-top"><Badge className={`status-${job.status.toLowerCase()}`}>{enumLabel(job.status, locale)}</Badge><span>{t("jobs.proposals", { count: job._count.proposals })}</span></div>
      <div className="client-job-facts"><div><small>{tr("Budget")}</small><strong>{budget}</strong></div><div><small>{tr("Type")}</small><strong>{job.workType === "HOURLY" ? t("common.hourly") : t("common.fixedPrice")}</strong></div><div><small>{tr("Category")}</small><strong>{job.category.name}</strong></div><div><small>{tr("Experience")}</small><strong>{enumLabel(job.experienceLevel, locale)}</strong></div></div>
      <p className="client-job-description">{job.description}</p>
      <div className="selected-skills" aria-label="Required skills">{job.skills.map(({ skill }) => <span key={skill.id}>{skill.name}</span>)}</div>
      {job.status === "DRAFT" && <p className="client-job-guidance">{tr("This draft is private. Publish it when the brief and budget are ready for freelancers.")}</p>}
      {job.status === "OPEN" && <p className="client-job-guidance">{tr("This job is live and visible to signed-in freelancers.")}</p>}
      {job._count.proposals > 0 && ["OPEN", "PAUSED"].includes(job.status) && <p className="client-job-guidance">{tr("The brief is locked after the first proposal to preserve the terms freelancers responded to.")}</p>}
    </Card>

    {!editing && <div className="client-job-actions">
      {canEdit && <Button variant="outline" onClick={() => setEditing(true)}><Pencil size={16} /> {tr("Edit job")}</Button>}
      {canPublish && <Button onClick={() => publish.mutate()} disabled={publish.isPending}>{tr(publish.isPending ? "Publishing…" : job.status === "PAUSED" ? "Republish job" : "Publish job")}<CheckCircle2 size={16} /></Button>}
      {job.status !== "DRAFT" && <Link className="button button-outline" to={`/client/jobs/${job.id}/proposals`}><FileText size={16} /> {tr("Review proposals")}</Link>}
      {job.status === "OPEN" && <Link className="button button-outline" to={`/jobs/${job.id}`}>{tr("View listing")} <ExternalLink size={15} /></Link>}
      {canClose && !confirmClose && <Button variant="ghost" onClick={() => setConfirmClose(true)}><XCircle size={16} /> {tr("Close job")}</Button>}
    </div>}
    {confirmClose && <Card className="client-job-confirm"><div><strong>{tr("Close this job?")}</strong><p>{tr("Freelancers will no longer find it in open job listings. Existing proposals remain available.")}</p></div><div><Button type="button" variant="outline" onClick={() => setConfirmClose(false)}>{tr("Keep open")}</Button><Button type="button" onClick={() => close.mutate()} disabled={close.isPending}>{tr(close.isPending ? "Closing…" : "Close job")}</Button></div></Card>}
    {(publish.isError || close.isError) && <p className="form-error" role="alert">{publish.error?.message ?? close.error?.message}</p>}
    {editing && <div className="client-job-edit"><div className="section-heading"><div><span className="eyebrow">{tr("Edit brief")}</span><h2>{tr("Refine the opportunity")}</h2></div></div><JobForm key={job.id} initial={jobFormFromJob(job)} onSave={(payload) => save.mutate(payload)} busy={save.isPending} error={save.error?.message} submitLabel={tr("Save changes")} onCancel={() => setEditing(false)} /></div>}
    {!editing && <Link to="/dashboard" className="view-all">{tr("Return to overview")} <ArrowRight size={16} /></Link>}
  </section>;
}
