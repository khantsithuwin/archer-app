import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, LayoutDashboard, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, authState, normalizeUser, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function useCurrentUser() { return useQuery({ queryKey: ["me", authState.token], queryFn: async () => normalizeUser((await api<User & { modes: (string | { mode: string })[] }>("/auth/me")).data), enabled: Boolean(authState.token), retry: false }); }

export function Layout() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = () => { authState.token = null; navigate("/"); };
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><span className="brand-mark">↗</span><span>archer</span></Link>
      <nav className="main-nav">
        <NavLink to="/jobs"><Compass size={16} /> Discover work</NavLink>
        {user && <NavLink to="/dashboard"><LayoutDashboard size={16} /> Workspace</NavLink>}
      </nav>
      <div className="top-actions">{user ? <><Link className="icon-link" to="/messages"><MessageCircle size={18} /></Link><button className="user-chip" onClick={() => navigate("/dashboard")}><span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span>{user.displayName.split(" ")[0]}</span></button><Button variant="ghost" onClick={logout}>Sign out</Button></> : <><Link className="text-link" to="/login">Sign in</Link><Button onClick={() => navigate("/login")}>Get started</Button></>}</div>
    </header>
    <main><Outlet /></main>
    <footer className="footer"><span>© 2026 Archer</span><span>Independent work, done thoughtfully.</span></footer>
  </div>;
}
