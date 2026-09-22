import { Search, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Job } from "@/lib/api";
import { JobCard } from "@/components/job-card";
import { useI18n } from "@/i18n";

export function JobsPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<"" | "USD" | "MMK">("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs", query, currency],
    queryFn: async () => (await api<Job[]>(`/jobs?limit=50${query ? `&q=${encodeURIComponent(query)}` : ""}${currency ? `&currency=${currency}` : ""}`)).data,
  });

  return <section className="page-section jobs-page">
    <div className="page-heading">
      <div><span className="eyebrow">{t("jobs.eyebrow")}</span><h1>{t("jobs.title")}</h1><p>{t("jobs.subtitle")}</p></div>
    </div>
    <div className="search-bar">
      <Search size={19} aria-hidden="true" />
      <input aria-label={t("jobs.search")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("jobs.searchPlaceholder")} />
      {query && <button className="clear-search" type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button>}
      <span className="search-divider" />
      <select aria-label={t("forms.currency")} value={currency} onChange={(event) => setCurrency(event.target.value as "" | "USD" | "MMK")}><option value="">{t("jobs.allCurrencies")}</option><option value="USD">USD</option><option value="MMK">MMK</option></select>
    </div>
    <div className="results-row"><span>{t("jobs.results", { count: data?.length ?? 0 })}</span></div>
    {isLoading ? <div className="results-grid">{[1, 2, 3, 4].map((key) => <div className="skeleton-card" key={key} />)}</div>
      : isError ? <div className="empty-state"><h3>{t("jobs.unavailable")}</h3><p>{t("jobs.unavailableBody")}</p><button className="button button-outline" onClick={() => refetch()}>{t("common.tryAgain")}</button></div>
      : data?.length ? <div className="results-grid">{data.map((job) => <JobCard key={job.id} job={job} />)}</div>
      : <div className="empty-state"><h3>{t("jobs.none")}</h3><p>{t("jobs.noneBody")}</p></div>}
  </section>;
}
