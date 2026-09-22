import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { money, type Job } from "@/lib/api";
import { useI18n } from "@/i18n";

export function JobCard({ job }: { job: Job }) {
  const { t } = useI18n();
  return <article className="job-card">
    <div className="job-card-top"><span className="job-category">{job.category.name}</span><span className="job-type">{job.workType === "FIXED_PRICE" ? t("common.fixedPrice") : t("common.hourly")}</span></div>
    <Link to={`/jobs/${job.id}`} className="job-title"><span>{job.title}</span><ArrowUpRight size={19} aria-hidden="true" /></Link>
    <p className="job-excerpt">{job.description}</p>
    <div className="job-tags">{job.skills.slice(0, 3).map(({ skill }) => <span key={skill.slug}>{skill.name}</span>)}</div>
    <div className="job-meta"><span><MapPin size={15} /> {job.client.country ?? t("common.remote")}</span><span><Clock3 size={15} /> {job.estimatedDuration ?? t("common.flexible")}</span><strong>{money(job.budgetMinMinor, job.currency)} – {money(job.budgetMaxMinor, job.currency)}</strong></div>
  </article>;
}
