import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { money, type Job } from "@/lib/api";

export function JobCard({ job }: { job: Job }) {
  return <Card className="job-card"><div className="job-card-top"><Badge>{job.workType === "FIXED_PRICE" ? "Fixed price" : "Hourly"}</Badge><span className="muted">{job.currency}</span></div><Link to={`/jobs/${job.id}`} className="job-title">{job.title}<ArrowUpRight size={17} /></Link><p className="job-excerpt">{job.description}</p><div className="job-tags">{job.skills.slice(0, 4).map(({ skill }) => <span key={skill.slug}>{skill.name}</span>)}</div><div className="job-meta"><span><Clock3 size={15} /> {job.estimatedDuration ?? "Flexible"}</span><span><MapPin size={15} /> {job.client.country ?? "Remote"}</span><strong>{money(job.budgetMinMinor, job.currency)} – {money(job.budgetMaxMinor, job.currency)}</strong></div></Card>;
}
