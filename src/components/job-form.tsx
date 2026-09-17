import { ArrowRight, Check, CircleDollarSign, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Category } from "@/lib/api";
import { emptyJobForm, jobFormPayload, jobFormSchema, type JobFormValues } from "@/lib/job-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type JobFormProps = {
  initial?: JobFormValues;
  onSave: (payload: ReturnType<typeof jobFormPayload>) => void;
  busy: boolean;
  error?: string;
  submitLabel: string;
  onCancel?: () => void;
};

export function JobForm({ initial = emptyJobForm, onSave, busy, error, submitLabel, onCancel }: JobFormProps) {
  const [form, setForm] = useState<JobFormValues>(() => ({ ...initial, skillIds: [...initial.skillIds] }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: categories, isLoading, isError, refetch } = useQuery({ queryKey: ["categories"], queryFn: async () => (await api<Category[]>("/categories")).data });
  const skills = categories?.flatMap((category) => category.skills) ?? [];
  const update = <K extends keyof JobFormValues,>(key: K, value: JobFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = jobFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    onSave(jobFormPayload(parsed.data));
  };

  return <Card className="job-form-card"><form onSubmit={submit} noValidate>
    <label>Project title<input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Build a customer research dashboard" maxLength={150} />{errors.title && <span className="field-error">{errors.title}</span>}</label>
    <label>Tell us about the project<textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="What are you trying to achieve? What does a great outcome look like?" maxLength={20_000} rows={7} />{errors.description && <span className="field-error">{errors.description}</span>}</label>
    <div className="form-grid"><label>Category<select value={form.categoryId} disabled={isLoading || isError} onChange={(event) => update("categoryId", event.target.value)}><option value="">{isLoading ? "Loading categories…" : "Select category"}</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <span className="field-error">{errors.categoryId}</span>}</label><label>Type of work<select value={form.workType} onChange={(event) => update("workType", event.target.value as JobFormValues["workType"])}><option value="FIXED_PRICE">Fixed price</option><option value="HOURLY">Hourly</option></select></label></div>
    <label>Skills<select aria-label="Add a required skill" value="" disabled={isLoading || isError || form.skillIds.length >= 20} onChange={(event) => { if (event.target.value && !form.skillIds.includes(event.target.value)) update("skillIds", [...form.skillIds, event.target.value]); }}><option value="">{isLoading ? "Loading skills…" : "Add a skill"}</option>{categories?.map((category) => <optgroup key={category.id} label={category.name}>{category.skills.map((skill) => <option key={skill.id} value={skill.id} disabled={form.skillIds.includes(skill.id)}>{skill.name}</option>)}</optgroup>)}</select>{errors.skillIds && <span className="field-error">{errors.skillIds}</span>}</label>
    {form.skillIds.length > 0 && <div className="selected-skills" aria-label="Required skills">{form.skillIds.map((skillId) => { const label = skills.find((skill) => skill.id === skillId)?.name ?? "Skill"; return <span key={skillId}>{label}<button type="button" aria-label={`Remove ${label}`} onClick={() => update("skillIds", form.skillIds.filter((id) => id !== skillId))}><X size={13} /></button></span>; })}</div>}
    {isError && <div className="inline-error">Categories and skills could not be loaded. <button type="button" onClick={() => refetch()}>Try again</button></div>}
    <div className="form-grid"><label>Currency<select value={form.currency} onChange={(event) => { setForm((current) => ({ ...current, currency: event.target.value as JobFormValues["currency"], budgetMin: "", budgetMax: "" })); setErrors({}); }}><option value="USD">USD · US dollars</option><option value="MMK">MMK · Myanmar kyat</option></select></label><label>Experience level<select value={form.experienceLevel} onChange={(event) => update("experienceLevel", event.target.value as JobFormValues["experienceLevel"])}><option value="ENTRY">Entry</option><option value="INTERMEDIATE">Intermediate</option><option value="EXPERT">Expert</option></select></label></div>
    <div className="form-grid"><label>{form.workType === "HOURLY" ? "Hourly budget from" : "Budget from"}<input type="text" inputMode="decimal" value={form.budgetMin} onChange={(event) => update("budgetMin", event.target.value)} placeholder={form.currency === "USD" ? "500.00" : "500000"} />{errors.budgetMin && <span className="field-error">{errors.budgetMin}</span>}</label><label>{form.workType === "HOURLY" ? "Hourly budget to" : "Budget to"}<input type="text" inputMode="decimal" value={form.budgetMax} onChange={(event) => update("budgetMax", event.target.value)} placeholder={form.currency === "USD" ? "1500.00" : "1500000"} />{errors.budgetMax && <span className="field-error">{errors.budgetMax}</span>}</label></div>
    <p className="currency-note"><CircleDollarSign size={16} /> {form.currency === "USD" ? "Enter dollars and cents; Archer stores exact cents." : "Enter whole kyat; Archer does not convert currencies."}</p>
    <label>Estimated duration <span className="optional">Optional</span><input value={form.estimatedDuration} onChange={(event) => update("estimatedDuration", event.target.value)} placeholder="e.g. 1–3 months" maxLength={80} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-footer"><span className="muted"><Check size={15} /> Archer does not process payments.</span><div className="job-form-actions">{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}<Button type="submit" disabled={busy || isLoading || isError}>{busy ? "Saving…" : submitLabel}<ArrowRight size={16} /></Button></div></div>
  </form></Card>;
}
