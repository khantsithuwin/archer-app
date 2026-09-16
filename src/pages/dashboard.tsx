import { ArrowRight, BriefcaseBusiness, FileText, Plus, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, money, type Contract, type Job, type Proposal } from "@/lib/api";
import { useCurrentUser } from "@/components/layout";

export function DashboardPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const isClient = user?.modes.includes("CLIENT");
  const needsProfile = Boolean(user && ((user.modes.includes("CLIENT") && !user.clientProfile) || (user.modes.includes("FREELANCER") && !user.freelancerProfile)));
  const { data: jobs, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: async () => (await api<Job[]>("/client/jobs")).data,
    enabled: Boolean(user && isClient),
  });
  const { data: proposals, isLoading: proposalsLoading, isError: proposalsError } = useQuery({
    queryKey: ["my-proposals"],
    queryFn: async () => (await api<Proposal[]>("/proposals")).data,
    enabled: Boolean(user && !isClient),
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
  const loading = userLoading || jobsLoading || proposalsLoading || contractsLoading;

  if (userLoading) return <section className="page-section dashboard"><div className="detail-skeleton" /></section>;
  if (!user) return <section className="page-section dashboard"><div className="empty-card dashboard-auth"><h1>Sign in to your workspace</h1><p>Your jobs, proposals, and contracts will be here when you sign in.</p><Link className="button" to="/login">Sign in <ArrowRight size={16} /></Link></div></section>;

  return <section className="page-section dashboard">
    <div className="dashboard-hero">
      <div><span className="eyebrow">Workspace overview</span><h1>Good morning, {user?.displayName.split(" ")[0] ?? "there"}.</h1><p>Here’s a clear view of what’s happening with your work.</p></div>
      {isClient && <Link className="button" to="/client/jobs/new"><Plus size={17} /> Post a job</Link>}
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
        {(jobsError || proposalsError) ? <div className="empty-card"><h3>Activity is unavailable</h3><p>Please refresh this page to try again.</p></div>
          : isClient ? jobs?.length ? <div className="activity-list">{jobs.map((job) => <div className="activity-row" key={job.id}><div className="activity-copy"><span className={"status status-" + (job.status ?? "DRAFT").toLowerCase()}>{(job.status ?? "DRAFT").replaceAll("_", " ")}</span>{job.status === "DRAFT" ? <strong>{job.title}</strong> : <Link to={`/jobs/${job.id}`}>{job.title}</Link>}<small>{job.category.name} · {job._count?.proposals ?? 0} proposals</small></div><div className="activity-side"><strong>{money(job.budgetMinMinor, job.currency)}</strong><Link to={`/client/jobs/${job.id}/proposals`} aria-label={`Review proposals for ${job.title}`}>Review <ArrowRight size={15} /></Link></div></div>)}</div>
            : <div className="empty-card"><h3>Your first job starts here</h3><p>Post a clear project brief to start meeting the right talent.</p><Link className="button" to="/client/jobs/new">Post a job</Link></div>
          : proposals?.length ? <div className="activity-list">{proposals.map((proposal) => <div className="activity-row" key={proposal.id}><div className="activity-copy"><span className={"status status-" + proposal.status.toLowerCase()}>{proposal.status.replaceAll("_", " ")}</span><Link to={`/jobs/${proposal.job.id}`}>{proposal.job.title}</Link><small>Proposed {money(proposal.amountMinor, proposal.currency)}</small></div><div className="activity-side">{proposal.contract ? <Link to={`/contracts/${proposal.contract.id}`}>View contract <ArrowRight size={15} /></Link> : <span className="muted">Awaiting update</span>}</div></div>)}</div>
            : <div className="empty-card"><h3>Find a project that fits</h3><p>Explore open opportunities and send your first proposal.</p><Link className="button" to="/jobs">Browse jobs</Link></div>}
      </div>

      <aside className="dashboard-aside"><div className="aside-heading"><span className="eyebrow">Work in progress</span><h2>Contracts</h2></div>{contracts?.length ? <div className="compact-contracts">{contracts.slice(0, 4).map((contract) => <Link to={`/contracts/${contract.id}`} key={contract.id}><span className={"status status-" + contract.status.toLowerCase()}>{contract.status.replaceAll("_", " ")}</span><strong>{contract.job.title}</strong><ArrowRight size={16} /></Link>)}</div> : <p className="muted">Accepted proposals will appear here.</p>}<Link className="aside-footer-link" to="/contracts">View all contracts <ArrowRight size={16} /></Link></aside>
    </div>
  </section>;
}
