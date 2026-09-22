import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { proposalFormPayload, proposalFormSchema, type ProposalFormValues } from "@/lib/proposal-form";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
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

  return <Card className="proposal-form-card"><div className="section-heading"><div><span className="eyebrow">{t("proposal.yours")}</span><h3>{title}</h3></div></div><form onSubmit={submit} noValidate>
    <label>{t("proposal.coverLetter")}<textarea rows={6} value={form.coverLetter} onChange={(event) => update("coverLetter", event.target.value)} maxLength={5000} placeholder={t("proposal.coverHint")} />{errors.coverLetter && <span className="field-error">{errors.coverLetter}</span>}</label>
    <label>{t("proposal.amount", { currency: form.currency })}<input type="text" inputMode={form.currency === "USD" ? "decimal" : "numeric"} value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder={form.currency === "USD" ? "250.00" : "250000"} />{errors.amount && <span className="field-error">{errors.amount}</span>}</label>
    <p className="currency-note">{form.currency === "USD" ? t("proposal.usdNote") : t("proposal.mmkNote")} {t("common.paymentsDisclaimer")}</p>
    <label>{t("forms.duration")} <span className="optional">{t("common.optional")}</span><input value={form.estimatedDuration} onChange={(event) => update("estimatedDuration", event.target.value)} placeholder={t("proposal.durationHint")} maxLength={80} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="proposal-form-actions"><Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button><Button type="submit" disabled={busy}>{busy ? t("common.saving") : submitLabel}</Button></div>
  </form></Card>;
}
