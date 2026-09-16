import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { money, type Job } from "@/lib/api";

export function JobCard({ job }: { job: Job }) {
  return <article className="job-card">
    <div className="job-card-top"><span className="job-category">{job.category.name}</span><span className="job-type">{job.workType === "FIXED_PRICE" ? "Fixed price" : "Hourly"}</span></div>
    <Link to={`/jobs/${job.id}`} className="job-title"><span>{job.title}</span><ArrowUpRight size={19} aria-hidden="true" /></Link>
    <p className="job-excerpt">{job.description}</p>
    <div className="job-tags">{job.skills.slice(0, 3).map(({ skill }) => <span key={skill.slug}>{skill.name}</span>)}</div>
    <div className="job-meta"><span><MapPin size={15} /> {job.client.country ?? "Remote"}</span><span><Clock3 size={15} /> {job.estimatedDuration ?? "Flexible"}</span><strong>{money(job.budgetMinMinor, job.currency)} – {money(job.budgetMaxMinor, job.currency)}</strong></div>
  </article>;
}
