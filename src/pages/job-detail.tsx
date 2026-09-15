import { ArrowLeft, CalendarDays, Clock3, MapPin, Send, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api, authState, money, type Job } from "@/lib/api";
import { useCurrentUser } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("I understand the goals and can deliver this project with clear milestones, frequent updates, and tested results.");
  const [amount, setAmount] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [proposalError, setProposalError] = useState<string | null>(null);
  const { data: job, isLoading, isError } = useQuery({ queryKey: ["job", jobId], queryFn: async () => (await api<Job>(`/jobs/${jobId}`)).data, enabled: Boolean(jobId) });
  const proposalMutation = useMutation({ mutationFn: async () => { if (!job) throw new Error("Job is still loading."); const amountMinor = job.currency === "USD" ? Math.round(Number(amount) * 100) : Math.round(Number(amount)); return (await api(`/jobs/${job.id}/proposals`, { method: "POST", body: JSON.stringify({ coverLetter, amountMinor, estimatedDuration: estimatedDuration || null, milestones: [] }) })).data; }, onSuccess: () => { setShowProposalForm(false); setProposalError(null); queryClient.invalidateQueries({ queryKey: ["job", jobId] }); } });
  if (isLoading) return <section className="page-section"><div className="detail-skeleton" /></section>;
  if (isError || !job) return <section className="page-section"><div className="empty-state"><h3>That job could not be found</h3><Link to="/jobs">Back to jobs</Link></div></section>;
  const canPropose = Boolean(user?.modes.includes("FREELANCER"));
  const openProposalForm = () => { if (!authState.token) { navigate("/login"); return; } if (user && !canPropose) { setProposalError("Sign in with a freelancer account to submit a proposal."); return; } setAmount((job.budgetMinMinor / (job.currency === "USD" ? 100 : 1)).toString()); setShowProposalForm(true); setProposalError(null); };
  const submitProposal = (event: FormEvent) => { event.preventDefault(); setProposalError(null); if (!coverLetter.trim() || coverLetter.trim().length < 40) { setProposalError("Please write at least 40 characters about your approach."); return; } if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) { setProposalError("Enter a valid proposal amount."); return; } proposalMutation.mutate(); };
  return <section className="page-section"><Link to="/jobs" className="back-link"><ArrowLeft size={16} /> All opportunities</Link><div className="detail-layout"><article><div className="detail-eyebrow"><Badge>{job.workType === "FIXED_PRICE" ? "Fixed price" : "Hourly"}</Badge><span>{job.category.name}</span></div><h1>{job.title}</h1><div className="job-meta detail-meta"><span><Clock3 size={15} /> {job.estimatedDuration ?? "Flexible"}</span><span><MapPin size={15} /> {job.client.country ?? "Remote"}</span><span><CalendarDays size={15} /> Posted recently</span></div><div className="prose"><h3>About the project</h3><p>{job.description}</p></div><div className="job-tags detail-tags">{job.skills.map(({ skill }) => <span key={skill.slug}>{skill.name}</span>)}</div></article><aside className="apply-panel"><Card><span className="eyebrow">Project budget</span><strong className="budget">{money(job.budgetMinMinor, job.currency)} – {money(job.budgetMaxMinor, job.currency)}</strong><span className="muted">{job.currency} · {job.experienceLevel.toLowerCase()} level</span><Button className="button-wide" onClick={openProposalForm}><Send size={16} /> Submit a proposal</Button>{proposalError && <p className="form-error">{proposalError}</p>}<p className="fine-print"><ShieldCheck size={14} /> Your proposal stays private to this client.</p></Card>{showProposalForm && <Card className="proposal-form-card"><div className="section-heading"><div><span className="eyebrow">Your proposal</span><h3>Make a thoughtful case</h3></div><button className="close-button" type="button" onClick={() => setShowProposalForm(false)} aria-label="Close proposal form">×</button></div><form onSubmit={submitProposal}><label>Cover letter<textarea rows={6} value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} /></label><label>Proposed amount ({job.currency})<input type="number" min="1" step={job.currency === "USD" ? "0.01" : "1"} value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Estimated duration<input value={estimatedDuration} onChange={(event) => setEstimatedDuration(event.target.value)} placeholder={job.estimatedDuration ?? "For example, 4 weeks"} /></label>{proposalMutation.isError && <p className="form-error">{proposalMutation.error.message}</p>}<Button type="submit" disabled={proposalMutation.isPending}>{proposalMutation.isPending ? "Sending…" : "Send proposal"}</Button></form></Card>}<Card className="client-card"><span className="eyebrow">About the client</span><div className="client-row"><span className="avatar">{job.client.displayName.slice(0, 1)}</span><span><strong>{job.client.displayName}</strong><small>{job.client.country ?? "Remote"}</small></span></div></Card></aside></div></section>;
}
