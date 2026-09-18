import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { proposalFormPayload, proposalFormSchema, type ProposalFormValues } from "@/lib/proposal-form";

type ProposalFormProps = {
  initial: ProposalFormValues;
  title: string;
  submitLabel: string;
  busy: boolean;
  error?: string;
  onSave: (payload: ReturnType<typeof proposalFormPayload>) => void;
  onCancel: () => void;
};

export function ProposalForm({ initial, title, submitLabel, busy, error, onSave, onCancel }: ProposalFormProps) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = (key: "coverLetter" | "amount" | "estimatedDuration", value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = proposalFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    onSave(proposalFormPayload(parsed.data));
  };

  return <Card className="proposal-form-card"><div className="section-heading"><div><span className="eyebrow">Your proposal</span><h3>{title}</h3></div></div><form onSubmit={submit} noValidate>
    <label>Cover letter<textarea rows={6} value={form.coverLetter} onChange={(event) => update("coverLetter", event.target.value)} maxLength={5000} placeholder="Explain your approach and relevant experience." />{errors.coverLetter && <span className="field-error">{errors.coverLetter}</span>}</label>
    <label>Proposed amount ({form.currency})<input type="text" inputMode={form.currency === "USD" ? "decimal" : "numeric"} value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder={form.currency === "USD" ? "250.00" : "250000"} />{errors.amount && <span className="field-error">{errors.amount}</span>}</label>
    <p className="currency-note">{form.currency === "USD" ? "Enter dollars and cents. Your amount stays in USD." : "Enter whole kyat. Your amount stays in MMK."} Archer does not process payments.</p>
    <label>Estimated duration <span className="optional">Optional</span><input value={form.estimatedDuration} onChange={(event) => update("estimatedDuration", event.target.value)} placeholder="For example, 4 weeks" maxLength={80} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="proposal-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button></div>
  </form></Card>;
}
