import { ArrowLeft, CalendarDays, Clock3, MapPin, Send, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, money, type Job } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function JobDetailPage() {
  const { jobId } = useParams();
  const { data: job, isLoading, isError } = useQuery({ queryKey: ["job", jobId], queryFn: async () => (await api<Job>(`/jobs/${jobId}`)).data, enabled: Boolean(jobId) });
  if (isLoading) return <section className="page-section"><div className="detail-skeleton" /></section>;
  if (isError || !job) return <section className="page-section"><div className="empty-state"><h3>That job could not be found</h3><Link to="/jobs">Back to jobs</Link></div></section>;
  return <section className="page-section"><Link to="/jobs" className="back-link"><ArrowLeft size={16} /> All opportunities</Link><div className="detail-layout"><article><div className="detail-eyebrow"><Badge>{job.workType === "FIXED_PRICE" ? "Fixed price" : "Hourly"}</Badge><span>{job.category.name}</span></div><h1>{job.title}</h1><div className="job-meta detail-meta"><span><Clock3 size={15} /> {job.estimatedDuration ?? "Flexible"}</span><span><MapPin size={15} /> {job.client.country ?? "Remote"}</span><span><CalendarDays size={15} /> Posted recently</span></div><div className="prose"><h3>About the project</h3><p>{job.description}</p></div><div className="job-tags detail-tags">{job.skills.map(({ skill }) => <span key={skill.slug}>{skill.name}</span>)}</div></article><aside className="apply-panel"><Card><span className="eyebrow">Project budget</span><strong className="budget">{money(job.budgetMinMinor, job.currency)} – {money(job.budgetMaxMinor, job.currency)}</strong><span className="muted">{job.currency} · {job.experienceLevel.toLowerCase()} level</span><Button className="button-wide"><Send size={16} /> Submit a proposal</Button><p className="fine-print"><ShieldCheck size={14} /> Your proposal stays private to this client.</p></Card><Card className="client-card"><span className="eyebrow">About the client</span><div className="client-row"><span className="avatar">{job.client.displayName.slice(0, 1)}</span><span><strong>{job.client.displayName}</strong><small>{job.client.country ?? "Remote"}</small></span></div></Card></aside></div></section>;
}
