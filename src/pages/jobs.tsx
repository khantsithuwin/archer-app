import { Search, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Job } from "@/lib/api";
import { JobCard } from "@/components/job-card";

export function JobsPage() {
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<"" | "USD" | "MMK">("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs", query, currency],
    queryFn: async () => (await api<Job[]>(`/jobs?limit=50${query ? `&q=${encodeURIComponent(query)}` : ""}${currency ? `&currency=${currency}` : ""}`)).data,
  });

  return <section className="page-section jobs-page">
    <div className="page-heading">
      <div><span className="eyebrow">Find your next opportunity</span><h1>Work worth doing.</h1><p>Explore open projects from clients looking for people with your skills.</p></div>
    </div>
    <div className="search-bar">
      <Search size={19} aria-hidden="true" />
      <input aria-label="Search jobs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by project, skill, or keyword" />
      {query && <button className="clear-search" type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button>}
      <span className="search-divider" />
      <select aria-label="Filter by currency" value={currency} onChange={(event) => setCurrency(event.target.value as "" | "USD" | "MMK")}><option value="">All currencies</option><option value="USD">USD</option><option value="MMK">MMK</option></select>
    </div>
    <div className="results-row"><span><strong>{data?.length ?? 0}</strong> open opportunities</span><span className="muted">Most recent first</span></div>
    {isLoading ? <div className="results-grid">{[1, 2, 3, 4].map((key) => <div className="skeleton-card" key={key} />)}</div>
      : isError ? <div className="empty-state"><h3>Couldn’t load opportunities</h3><p>Please try again in a moment.</p><button className="button button-outline" onClick={() => refetch()}>Try again</button></div>
      : data?.length ? <div className="results-grid">{data.map((job) => <JobCard key={job.id} job={job} />)}</div>
      : <div className="empty-state"><h3>No jobs match your search</h3><p>Try a broader keyword or a different currency.</p></div>}
  </section>;
}
