import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, authState, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("client1@archer.local");
  const [password, setPassword] = useState("ArcherDemo123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { const response = await api<{ user: User; accessToken: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); authState.token = response.data.accessToken; navigate("/dashboard"); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in."); } finally { setBusy(false); } };
  return <section className="auth-page"><div className="auth-intro"><span className="eyebrow">Welcome back</span><h1>Good work starts with a good conversation.</h1><p>Sign in to pick up where you left off, whether you’re building a team or building your craft.</p><Link to="/jobs" className="back-link">Browse jobs without signing in <ArrowRight size={16} /></Link></div><Card className="auth-card"><div className="auth-card-heading"><span className="brand-mark">↗</span><div><h2>Sign in to Archer</h2><p>Use a demo account or your Archer credentials.</p></div></div><form onSubmit={submit}><label>Email address<div className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></label><label>Password<div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error && <p className="form-error">{error}</p>}<Button type="submit" className="button-wide" disabled={busy}>{busy ? "Signing in…" : "Continue"}<ArrowRight size={16} /></Button></form><div className="demo-note"><strong>Demo accounts</strong><span>client1@archer.local · freelancer1@archer.local</span><span>Password: ArcherDemo123!</span></div></Card></section>;
}
