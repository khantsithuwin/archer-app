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

export function ClientJobPage() {
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

  if (!isClient) return <section className="page-section narrow-page"><div className="empty-card"><h1>Client access required</h1><p>Only client accounts can manage jobs.</p><Link className="button" to="/dashboard">Back to workspace</Link></div></section>;
  if (isLoading) return <section className="page-section narrow-page"><div className="detail-skeleton" aria-label="Loading job" /></section>;
  if (isError || !job) return <section className="page-section narrow-page"><div className="empty-card"><h1>Job unavailable</h1><p>This job could not be found in your client workspace.</p><Link className="button" to="/dashboard">Back to workspace</Link></div></section>;

  const canEdit = ["DRAFT", "OPEN", "PAUSED"].includes(job.status) && job._count.proposals === 0;
  const canPublish = job.status === "DRAFT" || job.status === "PAUSED";
  const canClose = job.status === "OPEN" || job.status === "PAUSED";
  const budget = job.budgetMinMinor != null && job.budgetMaxMinor != null ? `${money(job.budgetMinMinor, job.currency)} – ${money(job.budgetMaxMinor, job.currency)}` : "Budget not set";

  return <section className="page-section narrow-page client-job-page">
    <Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to workspace</Link>
    <div className="form-heading"><span className="eyebrow">Client workspace</span><h1>{job.title}</h1><p>Manage the brief, visibility, and proposals for this opportunity.</p></div>
    <Card className="client-job-overview">
      <div className="client-job-overview-top"><Badge className={`status-${job.status.toLowerCase()}`}>{job.status.replaceAll("_", " ")}</Badge><span>{job._count.proposals} {job._count.proposals === 1 ? "proposal" : "proposals"}</span></div>
      <div className="client-job-facts"><div><small>Budget</small><strong>{budget}</strong></div><div><small>Type</small><strong>{job.workType === "HOURLY" ? "Hourly" : "Fixed price"}</strong></div><div><small>Category</small><strong>{job.category.name}</strong></div><div><small>Experience</small><strong>{job.experienceLevel.toLowerCase()}</strong></div></div>
      <p className="client-job-description">{job.description}</p>
      <div className="selected-skills" aria-label="Required skills">{job.skills.map(({ skill }) => <span key={skill.id}>{skill.name}</span>)}</div>
      {job.status === "DRAFT" && <p className="client-job-guidance">This draft is private. Publish it when the brief and budget are ready for freelancers.</p>}
      {job.status === "OPEN" && <p className="client-job-guidance">This job is live and visible to signed-in freelancers.</p>}
      {job._count.proposals > 0 && ["OPEN", "PAUSED"].includes(job.status) && <p className="client-job-guidance">The brief is locked after the first proposal to preserve the terms freelancers responded to.</p>}
    </Card>

    {!editing && <div className="client-job-actions">
      {canEdit && <Button variant="outline" onClick={() => setEditing(true)}><Pencil size={16} /> Edit job</Button>}
      {canPublish && <Button onClick={() => publish.mutate()} disabled={publish.isPending}>{publish.isPending ? "Publishing…" : job.status === "PAUSED" ? "Republish job" : "Publish job"}<CheckCircle2 size={16} /></Button>}
      {job.status !== "DRAFT" && <Link className="button button-outline" to={`/client/jobs/${job.id}/proposals`}><FileText size={16} /> Review proposals</Link>}
      {job.status === "OPEN" && <Link className="button button-outline" to={`/jobs/${job.id}`}>View listing <ExternalLink size={15} /></Link>}
      {canClose && !confirmClose && <Button variant="ghost" onClick={() => setConfirmClose(true)}><XCircle size={16} /> Close job</Button>}
    </div>}
    {confirmClose && <Card className="client-job-confirm"><div><strong>Close this job?</strong><p>Freelancers will no longer find it in open job listings. Existing proposals remain available.</p></div><div><Button type="button" variant="outline" onClick={() => setConfirmClose(false)}>Keep open</Button><Button type="button" onClick={() => close.mutate()} disabled={close.isPending}>{close.isPending ? "Closing…" : "Close job"}</Button></div></Card>}
    {(publish.isError || close.isError) && <p className="form-error" role="alert">{publish.error?.message ?? close.error?.message}</p>}
    {editing && <div className="client-job-edit"><div className="section-heading"><div><span className="eyebrow">Edit brief</span><h2>Refine the opportunity</h2></div></div><JobForm key={job.id} initial={jobFormFromJob(job)} onSave={(payload) => save.mutate(payload)} busy={save.isPending} error={save.error?.message} submitLabel="Save changes" onCancel={() => setEditing(false)} /></div>}
    {!editing && <Link to="/dashboard" className="view-all">Return to overview <ArrowRight size={16} /></Link>}
  </section>;
}
