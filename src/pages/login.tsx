import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api, authState, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n";

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { const response = await api<{ user: User; accessToken: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); authState.token = response.data.accessToken; const from = (location.state as { from?: string } | null)?.from; navigate(from?.startsWith("/") && !from.startsWith("//") ? from : "/dashboard", { replace: true }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in."); } finally { setBusy(false); } };
  const fillDemo = (account: "client" | "freelancer" | "both") => { setEmail(account === "client" ? "client1@archer.local" : account === "freelancer" ? "freelancer1@archer.local" : "both@archer.local"); setPassword("ArcherDemo123!"); setError(""); };
  return <section className="auth-page"><div className="auth-intro"><span className="eyebrow">{t("auth.welcomeBack")}</span><h1>{t("auth.loginHero")}</h1><p>{t("auth.loginBody")}</p><Link to="/" className="back-link">{t("auth.backHome")} <ArrowRight size={16} /></Link></div><Card className="auth-card"><div className="auth-card-heading"><span className="brand-mark">↗</span><div><h2>{t("auth.signInArcher")}</h2><p>{t("auth.credentials")}</p></div></div><form onSubmit={submit}><label>{t("auth.email")}<div className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></label><label>{t("auth.password")}<div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error && <p className="form-error">{error}</p>}<Button type="submit" className="button-wide" disabled={busy}>{busy ? t("auth.signingIn") : t("auth.continue")}<ArrowRight size={16} /></Button></form><div className="demo-note"><strong>{t("auth.demo")}</strong><span>{t("auth.demoBody")}</span><div className="demo-actions"><button type="button" onClick={() => fillDemo("client")}>{t("auth.clientDemo")}</button><button type="button" onClick={() => fillDemo("freelancer")}>{t("auth.freelancerDemo")}</button><button type="button" onClick={() => fillDemo("both")}>{t("auth.bothDemo")}</button></div></div><p className="auth-switch">{t("auth.noAccount")} <Link to="/signup">{t("auth.createAccount")}</Link></p></Card></section>;
}
