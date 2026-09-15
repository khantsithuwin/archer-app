import { ArrowRight, BriefcaseBusiness, FileText, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, money, type Contract, type Job, type Proposal } from "@/lib/api";
import { useCurrentUser } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const isClient = user?.modes.includes("CLIENT");
  const { data: jobs } = useQuery({ queryKey: ["my-jobs"], queryFn: async () => (await api<Job[]>("/client/jobs")).data, enabled: Boolean(user && isClient) });
  const { data: proposals } = useQuery({ queryKey: ["my-proposals"], queryFn: async () => (await api<Proposal[]>("/proposals")).data, enabled: Boolean(user && !isClient) });
  const { data: contracts } = useQuery({ queryKey: ["my-contracts"], queryFn: async () => (await api<Contract[]>("/contracts")).data, enabled: Boolean(user) });
  const receivedProposals = jobs?.reduce((total, job) => total + (job._count?.proposals ?? 0), 0) ?? 0;
  const activeProposals = proposals?.filter((proposal) => ["SUBMITTED", "SHORTLISTED"].includes(proposal.status)).length ?? 0;
  const primaryCount = isClient ? jobs?.length ?? 0 : proposals?.length ?? 0;
  const primaryLabel = isClient ? "Jobs posted" : "Proposals sent";
  const activityCount = isClient ? receivedProposals : activeProposals;
  const activityLabel = isClient ? "Proposals received" : "Active proposals";

  return <section className="page-section dashboard">
    <div className="dashboard-hero"><div><span className="eyebrow"><Sparkles size={14} /> Your workspace</span><h1>Good morning, {user?.displayName.split(" ")[0] ?? "there"}.</h1><p>Here’s where your next thoughtful piece of work begins.</p></div>{isClient && <Link to="/client/jobs/new"><Button><Plus size={17} /> Post a job</Button></Link>}</div>
    <div className="stat-grid"><Card><span className="stat-icon"><BriefcaseBusiness size={18} /></span><strong>{primaryCount}</strong><span>{primaryLabel}</span></Card><Card><span className="stat-icon"><FileText size={18} /></span><strong>{activityCount}</strong><span>{activityLabel}</span></Card><Card><span className="stat-icon"><Sparkles size={18} /></span><strong>{contracts?.length ?? 0}</strong><span>Contracts</span></Card></div>
    {isClient ? <div className="dashboard-block"><div className="section-heading"><div><span className="eyebrow">Client workspace</span><h2>Your jobs</h2></div><Link className="view-all" to="/client/jobs/new">Create a new job <ArrowRight size={16} /></Link></div>{jobs?.length ? <div className="my-job-list">{jobs.map((job) => <div className="my-job" key={job.id}><span><BadgeStatus status={job.status ?? "DRAFT"} /><Link className="my-job-title" to={`/jobs/${job.id}`}>{job.title}</Link><small>{job.category.name} · {job._count?.proposals ?? 0} proposals</small></span><span className="my-job-actions"><Link className="view-all" to={`/client/jobs/${job.id}/proposals`}>Review <ArrowRight size={15} /></Link><span className="my-job-budget">{money(job.budgetMinMinor, job.currency)}</span></span></div>)}</div> : <Card className="empty-card"><h3>Your first job is waiting</h3><p>Share a clear brief and meet people who can help move it forward.</p><Link to="/client/jobs/new"><Button>Post your first job</Button></Link></Card>}</div> : <Card className="dashboard-callout"><div><span className="eyebrow">For independent talent</span><h2>There’s work out there with your name on it.</h2><p>Explore open projects and find a brief that makes you curious.</p></div><Link to="/jobs"><Button>Explore jobs <ArrowRight size={16} /></Button></Link></Card>}
    <Card className="dashboard-callout contract-callout"><div><span className="eyebrow">Work management</span><h2>Keep the next step visible.</h2><p>{contracts?.length ?? 0} contract{contracts?.length === 1 ? "" : "s"} connected to this workspace.</p></div><Link to="/contracts"><Button variant="outline">Open contracts <ArrowRight size={16} /></Button></Link></Card>
  </section>;
}

function BadgeStatus({ status }: { status: string }) { return <span className={`status status-${status.toLowerCase()}`}>{status.toLowerCase().replace("_", " ")}</span>; }
