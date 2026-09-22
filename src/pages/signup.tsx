import { ArrowRight, BriefcaseBusiness, Mail, UserRound, UsersRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, authState, type User } from "@/lib/api";
import { registrationPayload, signUpSchema } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n";

type RoleChoice = "CLIENT" | "FREELANCER" | "BOTH";

export function SignUpPage() {
  const { t } = useI18n();
  const roleChoices = [
    { value: "CLIENT" as const, title: t("auth.hireTalent"), description: t("auth.hireDescription"), icon: BriefcaseBusiness },
    { value: "FREELANCER" as const, title: t("auth.findWork"), description: t("auth.findDescription"), icon: UserRound },
    { value: "BOTH" as const, title: t("auth.doBoth"), description: t("auth.bothDescription"), icon: UsersRound },
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({ displayName: "", email: "", password: "", confirmPassword: "", role: (new URLSearchParams(location.search).get("role") === "client" ? "CLIENT" : "FREELANCER") as RoleChoice }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key: keyof typeof form, value: string) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); setApiError(""); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setApiError("");
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setBusy(true);
    try {
      const response = await api<{ user: User; accessToken: string }>("/auth/register", { method: "POST", body: JSON.stringify(registrationPayload(parsed.data)) });
      queryClient.clear();
      authState.token = response.data.accessToken;
      navigate("/onboarding", { replace: true });
    } catch (reason) {
      setApiError(reason instanceof Error ? reason.message : "We could not create your account. Please try again.");
    } finally { setBusy(false); }
  };

  return <section className="auth-page signup-page">
    <div className="auth-intro"><span className="eyebrow">{t("auth.join")}</span><h1>{t("auth.goodWork")}</h1><p>{t("auth.createIntro")}</p><div className="signup-benefits"><span>01 <strong>{t("auth.chooseRole")}</strong></span><span>02 <strong>{t("auth.makeProfile")}</strong></span><span>03 <strong>{t("auth.startTogether")}</strong></span></div></div>
    <Card className="auth-card signup-card">
      <div className="auth-card-heading"><span className="brand-mark"><ArrowRight size={19} /></span><div><h2>{t("auth.createTitle")}</h2><p>{t("auth.createMinutes")}</p></div></div>
      <form onSubmit={submit} noValidate>
        <fieldset className="role-fieldset"><legend>{t("auth.hereTo")}</legend><div className="role-grid">{roleChoices.map(({ value, title, description, icon: Icon }) => <label className="role-option" key={value}><input type="radio" name="role" value={value} checked={form.role === value} onChange={() => update("role", value)} /><span className="role-option-icon"><Icon size={19} /></span><span><strong>{title}</strong><small>{description}</small></span></label>)}</div></fieldset>
        <label>{t("auth.fullName")}<div className="input-wrap"><UserRound size={17} /><input value={form.displayName} onChange={(event) => update("displayName", event.target.value)} autoComplete="name" placeholder={t("auth.yourName")} required maxLength={80} /></div>{errors.displayName && <span className="field-error">{errors.displayName}</span>}</label>
        <label>{t("auth.email")}<div className="input-wrap"><Mail size={17} /><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" placeholder="you@example.com" required /></div>{errors.email && <span className="field-error">{errors.email}</span>}</label>
        <div className="form-grid"><label>{t("auth.password")}<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required placeholder={t("auth.passwordHint")} />{errors.password && <span className="field-error">{errors.password}</span>}</label><label>{t("auth.confirmPassword")}<input type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" required placeholder={t("auth.repeatPassword")} />{errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}</label></div>
        {apiError && <p className="form-error" role="alert">{apiError}</p>}
        <Button type="submit" className="button-wide" disabled={busy}>{busy ? t("auth.creating") : t("auth.createAccount")}<ArrowRight size={16} /></Button>
      </form>
      <p className="auth-switch">{t("auth.already")} <Link to="/login">{t("nav.signIn")}</Link></p>
    </Card>
  </section>;
}
