import { ArrowRight, BriefcaseBusiness, FileText, Plus, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, money, type Contract, type OwnedJob, type Proposal } from "@/lib/api";
import { useCurrentUser } from "@/components/layout";

export function DashboardPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [activeMode, setActiveMode] = useState<"CLIENT" | "FREELANCER">("CLIENT");
  const hasClient = Boolean(user?.modes.includes("CLIENT"));
  const hasFreelancer = Boolean(user?.modes.includes("FREELANCER"));
  const isClient = hasClient && (!hasFreelancer || activeMode === "CLIENT");
  const needsProfile = Boolean(user && ((user.modes.includes("CLIENT") && !user.clientProfile) || (user.modes.includes("FREELANCER") && !user.freelancerProfile)));
  const { data: jobs, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: async () => (await api<OwnedJob[]>("/client/jobs")).data,
    enabled: Boolean(user && hasClient),
  });
  const { data: proposals, isLoading: proposalsLoading, isError: proposalsError } = useQuery({
    queryKey: ["my-proposals"],
    queryFn: async () => (await api<Proposal[]>("/proposals")).data,
    enabled: Boolean(user && hasFreelancer),
  });
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["my-contracts"],
    queryFn: async () => (await api<Contract[]>("/contracts")).data,
    enabled: Boolean(user),
  });

  const receivedProposals = jobs?.reduce((total, job) => total + (job._count?.proposals ?? 0), 0) ?? 0;
  const activeProposals = proposals?.filter((proposal) => ["SUBMITTED", "SHORTLISTED"].includes(proposal.status)).length ?? 0;
  const primaryCount = isClient ? jobs?.length ?? 0 : proposals?.length ?? 0;
  const activityCount = isClient ? receivedProposals : activeProposals;
  const loading = userLoading || (isClient ? jobsLoading : proposalsLoading) || contractsLoading;

  if (userLoading) return <section className="page-section dashboard"><div className="detail-skeleton" /></section>;
  if (!user) return <section className="page-section dashboard"><div className="empty-card dashboard-auth"><h1>Sign in to your workspace</h1><p>Your jobs, proposals, and contracts will be here when you sign in.</p><Link className="button" to="/login">Sign in <ArrowRight size={16} /></Link></div></section>;
  if (!hasClient && !hasFreelancer) return <section className="page-section dashboard"><div className="empty-card dashboard-auth"><h1>Admin web workspace is not available yet</h1><p>The API has admin tools for metrics, reports, and account moderation, but this web interface has not been built.</p></div></section>;

  return <section className="page-section dashboard">
    <div className="dashboard-hero">
      <div><span className="eyebrow">Workspace overview</span><h1>Good morning, {user?.displayName.split(" ")[0] ?? "there"}.</h1><p>Here’s a clear view of what’s happening with your work.</p></div>
      <div className="dashboard-hero-actions">{hasClient && hasFreelancer && <div className="mode-switch" role="group" aria-label="Workspace role"><button type="button" aria-pressed={isClient} onClick={() => setActiveMode("CLIENT")}>Client work</button><button type="button" aria-pressed={!isClient} onClick={() => setActiveMode("FREELANCER")}>Freelancer work</button></div>}{isClient && <Link className="button" to="/client/jobs/new"><Plus size={17} /> Post a job</Link>}</div>
    </div>

    {needsProfile && <div className="profile-reminder"><div><strong>Make a better first impression.</strong><p>Complete your profile so clients and freelancers know who they’re working with.</p></div><Link to="/onboarding">Complete profile <ArrowRight size={16} /></Link></div>}

    <div className="stat-grid">
      <div className="stat-card"><span className="stat-icon"><BriefcaseBusiness size={19} /></span><span className="stat-label">{isClient ? "Jobs posted" : "Proposals sent"}</span><strong>{loading ? "—" : primaryCount}</strong><span className="stat-caption">{isClient ? "Across all statuses" : "Your submitted applications"}</span></div>
      <div className="stat-card"><span className="stat-icon"><Send size={19} /></span><span className="stat-label">{isClient ? "Proposals received" : "Active proposals"}</span><strong>{loading ? "—" : activityCount}</strong><span className="stat-caption">{isClient ? "From independent talent" : "Awaiting a client decision"}</span></div>
      <div className="stat-card"><span className="stat-icon"><FileText size={19} /></span><span className="stat-label">Contracts</span><strong>{loading ? "—" : contracts?.length ?? 0}</strong><span className="stat-caption">Your work agreements</span></div>
    </div>

    <div className="dashboard-columns">
      <div className="dashboard-main">
        <div className="section-heading"><div><span className="eyebrow">{isClient ? "Client activity" : "Freelancer activity"}</span><h2>{isClient ? "Your jobs" : "Your proposals"}</h2></div>{isClient ? <Link className="view-all" to="/client/jobs/new">New job <ArrowRight size={16} /></Link> : <Link className="view-all" to="/jobs">Browse work <ArrowRight size={16} /></Link>}</div>
        {((isClient && jobsError) || (!isClient && proposalsError)) ? <div className="empty-card"><h3>Activity is unavailable</h3><p>Please refresh this page to try again.</p></div>
          : isClient ? jobs?.length ? <div className="activity-list">{jobs.map((job) => <div className="activity-row" key={job.id}><div className="activity-copy"><span className={"status status-" + job.status.toLowerCase()}>{job.status.replaceAll("_", " ")}</span><Link to={`/client/jobs/${job.id}`}>{job.title}</Link><small>{job.category.name} · {job._count.proposals} proposals</small></div><div className="activity-side"><strong>{job.budgetMinMinor != null ? money(job.budgetMinMinor, job.currency) : "Budget not set"}</strong><Link to={`/client/jobs/${job.id}`} aria-label={`Manage ${job.title}`}>Manage <ArrowRight size={15} /></Link></div></div>)}</div>
            : <div className="empty-card"><h3>Your first job starts here</h3><p>Post a clear project brief to start meeting the right talent.</p><Link className="button" to="/client/jobs/new">Post a job</Link></div>
          : proposals?.length ? <div className="activity-list">{proposals.map((proposal) => <div className="activity-row" key={proposal.id}><div className="activity-copy"><span className={"status status-" + proposal.status.toLowerCase()}>{proposal.status.replaceAll("_", " ")}</span><Link to={`/proposals/${proposal.id}`}>{proposal.job.title}</Link><small>Proposed {money(proposal.amountMinor, proposal.currency)}</small></div><div className="activity-side">{proposal.contract ? <Link to={`/contracts/${proposal.contract.id}`}>View contract <ArrowRight size={15} /></Link> : <Link to={`/proposals/${proposal.id}`}>Manage <ArrowRight size={15} /></Link>}</div></div>)}</div>
            : <div className="empty-card"><h3>Find a project that fits</h3><p>Explore open opportunities and send your first proposal.</p><Link className="button" to="/jobs">Browse jobs</Link></div>}
      </div>

      <aside className="dashboard-aside"><div className="aside-heading"><span className="eyebrow">Work in progress</span><h2>Contracts</h2></div>{contracts?.length ? <div className="compact-contracts">{contracts.slice(0, 4).map((contract) => <Link to={`/contracts/${contract.id}`} key={contract.id}><span className={"status status-" + contract.status.toLowerCase()}>{contract.status.replaceAll("_", " ")}</span><strong>{contract.job.title}</strong><ArrowRight size={16} /></Link>)}</div> : <p className="muted">Accepted proposals will appear here.</p>}<Link className="aside-footer-link" to="/contracts">View all contracts <ArrowRight size={16} /></Link></aside>
    </div>
  </section>;
}
