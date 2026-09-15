import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Job } from "@/lib/api";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";

export function JobsPage() {
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<"" | "USD" | "MMK">("");
  const { data, isLoading, isError } = useQuery({ queryKey: ["jobs", query, currency], queryFn: async () => (await api<Job[]>(`/jobs?limit=50${query ? `&q=${encodeURIComponent(query)}` : ""}${currency ? `&currency=${currency}` : ""}`)).data });
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">Marketplace</span><h1>Find work with a little more meaning.</h1><p>Browse open opportunities from clients ready to build something good.</p></div><Button variant="outline"><SlidersHorizontal size={16} /> Filters</Button></div><div className="search-bar"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, skills, or keywords" /><select value={currency} onChange={(event) => setCurrency(event.target.value as "" | "USD" | "MMK")}><option value="">All currencies</option><option value="USD">USD</option><option value="MMK">MMK</option></select></div><div className="results-row"><span>{data?.length ?? 0} opportunities</span><span className="muted">Sorted by newest</span></div>{isLoading ? <div className="job-grid">{[1, 2, 3, 4].map((key) => <div className="skeleton-card" key={key} />)}</div> : isError ? <div className="empty-state"><h3>Couldn’t load opportunities</h3><p>Make sure the API is running at localhost:4000.</p></div> : data?.length ? <div className="job-grid">{data.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="empty-state"><h3>No jobs match that search</h3><p>Try a broader keyword or remove the currency filter.</p></div>}</section>;
}
