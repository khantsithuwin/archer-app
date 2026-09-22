import { ArrowRight, BriefcaseBusiness, FileText, Plus, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, money, type Contract, type OwnedJob, type Proposal } from "@/lib/api";
import { useCurrentUser } from "@/components/layout";
import { enumLabel, useI18n } from "@/i18n";

export function DashboardPage() {
  const { locale, t, tr } = useI18n();
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
      <div><span className="eyebrow">{tr("Workspace overview")}</span><h1>{tr("Good morning, {name}.", { name: user?.displayName.split(" ")[0] ?? "" })}</h1><p>{tr("Here’s a clear view of what’s happening with your work.")}</p></div>
      <div className="dashboard-hero-actions">{hasClient && hasFreelancer && <div className="mode-switch" role="group" aria-label="Workspace role"><button type="button" aria-pressed={isClient} onClick={() => setActiveMode("CLIENT")}>{tr("Client work")}</button><button type="button" aria-pressed={!isClient} onClick={() => setActiveMode("FREELANCER")}>{tr("Freelancer work")}</button></div>}{isClient && <Link className="button" to="/client/jobs/new"><Plus size={17} /> {t("nav.postJob")}</Link>}</div>
    </div>

    {needsProfile && <div className="profile-reminder"><div><strong>{tr("Make a better first impression.")}</strong><p>{tr("Complete your profile so clients and freelancers know who they’re working with.")}</p></div><Link to="/onboarding">{tr("Complete profile")} <ArrowRight size={16} /></Link></div>}

    <div className="stat-grid">
      <div className="stat-card"><span className="stat-icon"><BriefcaseBusiness size={19} /></span><span className="stat-label">{tr(isClient ? "Jobs posted" : "Proposals sent")}</span><strong>{loading ? "—" : primaryCount}</strong><span className="stat-caption">{tr(isClient ? "Across all statuses" : "Your submitted applications")}</span></div>
      <div className="stat-card"><span className="stat-icon"><Send size={19} /></span><span className="stat-label">{tr(isClient ? "Proposals received" : "Active proposals")}</span><strong>{loading ? "—" : activityCount}</strong><span className="stat-caption">{tr(isClient ? "From independent talent" : "Awaiting a client decision")}</span></div>
      <div className="stat-card"><span className="stat-icon"><FileText size={19} /></span><span className="stat-label">{t("nav.contracts")}</span><strong>{loading ? "—" : contracts?.length ?? 0}</strong><span className="stat-caption">{tr("Your work agreements")}</span></div>
    </div>

    <div className="dashboard-columns">
      <div className="dashboard-main">
        <div className="section-heading"><div><span className="eyebrow">{t(isClient ? "dashboard.client" : "dashboard.freelancer")}</span><h2>{t(isClient ? "dashboard.myJobs" : "dashboard.myProposals")}</h2></div>{isClient ? <Link className="view-all" to="/client/jobs/new">{tr("New job")} <ArrowRight size={16} /></Link> : <Link className="view-all" to="/jobs">{tr("Browse work")} <ArrowRight size={16} /></Link>}</div>
        {((isClient && jobsError) || (!isClient && proposalsError)) ? <div className="empty-card"><h3>{tr("Activity is unavailable")}</h3><p>{tr("Please refresh this page to try again.")}</p></div>
          : isClient ? jobs?.length ? <div className="activity-list">{jobs.map((job) => <div className="activity-row" key={job.id}><div className="activity-copy"><span className={"status status-" + job.status.toLowerCase()}>{enumLabel(job.status, locale)}</span><Link to={`/client/jobs/${job.id}`}>{job.title}</Link><small>{job.category.name} · {t("jobs.proposals", { count: job._count.proposals })}</small></div><div className="activity-side"><strong>{job.budgetMinMinor != null ? money(job.budgetMinMinor, job.currency) : tr("Budget not set")}</strong><Link to={`/client/jobs/${job.id}`}>{t("dashboard.manage")} <ArrowRight size={15} /></Link></div></div>)}</div>
            : <div className="empty-card"><h3>{tr("Your first job starts here")}</h3><p>{tr("Post a clear project brief to start meeting the right talent.")}</p><Link className="button" to="/client/jobs/new">{t("nav.postJob")}</Link></div>
          : proposals?.length ? <div className="activity-list">{proposals.map((proposal) => <div className="activity-row" key={proposal.id}><div className="activity-copy"><span className={"status status-" + proposal.status.toLowerCase()}>{enumLabel(proposal.status, locale)}</span><Link to={`/proposals/${proposal.id}`}>{proposal.job.title}</Link><small>{tr("Proposed amount")} {money(proposal.amountMinor, proposal.currency)}</small></div><div className="activity-side">{proposal.contract ? <Link to={`/contracts/${proposal.contract.id}`}>{tr("View contract")} <ArrowRight size={15} /></Link> : <Link to={`/proposals/${proposal.id}`}>{t("dashboard.manage")} <ArrowRight size={15} /></Link>}</div></div>)}</div>
            : <div className="empty-card"><h3>{tr("Find a project that fits")}</h3><p>{tr("Explore open opportunities and send your first proposal.")}</p><Link className="button" to="/jobs">{t("dashboard.browse")}</Link></div>}
      </div>

      <aside className="dashboard-aside"><div className="aside-heading"><span className="eyebrow">{tr("Work in progress")}</span><h2>{t("nav.contracts")}</h2></div>{contracts?.length ? <div className="compact-contracts">{contracts.slice(0, 4).map((contract) => <Link to={`/contracts/${contract.id}`} key={contract.id}><span className={"status status-" + contract.status.toLowerCase()}>{enumLabel(contract.status, locale)}</span><strong>{contract.job.title}</strong><ArrowRight size={16} /></Link>)}</div> : <p className="muted">{tr("Accepted proposals will appear here.")}</p>}<Link className="aside-footer-link" to="/contracts">{tr("View all contracts")} <ArrowRight size={16} /></Link></aside>
    </div>
  </section>;
}
