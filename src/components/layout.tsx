import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Compass, FileStack, LayoutDashboard, LogIn, MessageCircle, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, authState, normalizeUser, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function useCurrentUser() { return useQuery({ queryKey: ["me", authState.token], queryFn: async () => normalizeUser((await api<User & { modes: (string | { mode: string })[] }>("/auth/me")).data), enabled: Boolean(authState.token), retry: false }); }

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const isWorkspace = location.pathname === "/dashboard" || location.pathname.startsWith("/contracts") || location.pathname.startsWith("/client");
  const logout = () => { authState.token = null; navigate("/"); };
  return <div className="app-shell">
    {isWorkspace && <aside className="sidebar">
      <Link to="/" className="brand"><span className="brand-mark">↗</span><span>archer</span></Link>
      <span className="sidebar-label">Marketplace</span>
      <nav className="sidebar-nav">
        <NavLink to="/jobs"><Compass size={17} /> Discover work</NavLink>
        {user && <NavLink to="/dashboard"><LayoutDashboard size={17} /> Workspace</NavLink>}
        {user && <NavLink to="/contracts"><FileStack size={17} /> Contracts</NavLink>}
      </nav>
      {user?.modes.includes("CLIENT") && <Link to="/client/jobs/new" className="sidebar-create"><Plus size={16} /> Post a job</Link>}
      <div className="sidebar-spacer" />
      <div className="sidebar-footer">{user ? <><button className="sidebar-user" onClick={() => navigate("/dashboard")}><span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span><strong>{user.displayName}</strong><small>{user.modes.map((mode) => mode.toLowerCase()).join(" · ")}</small></span></button><button className="sidebar-signout" onClick={logout}>Sign out</button></> : <><span className="sidebar-note">A calmer way to find good work.</span><Link to="/login" className="sidebar-signin"><LogIn size={16} /> Sign in</Link></>}</div>
    </aside>}
    <div className="app-content">
      {isWorkspace ? <header className="mobile-topbar"><Link to="/" className="brand"><span className="brand-mark">↗</span><span>archer</span></Link>{user ? <button className="user-chip" onClick={() => navigate("/dashboard")}><span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span></button> : <Link className="mobile-signin" to="/login">Sign in</Link>}</header> : <header className="topbar public-topbar"><Link to="/" className="brand"><span className="brand-mark">↗</span><span>archer</span></Link><nav className="main-nav"><NavLink to="/jobs"><Compass size={16} /> Discover work</NavLink>{user && <NavLink to="/dashboard"><LayoutDashboard size={16} /> Workspace</NavLink>}</nav><div className="top-actions">{user ? <><Link className="icon-link" to="/messages" aria-label="Messages"><MessageCircle size={18} /></Link><button className="user-chip" onClick={() => navigate("/dashboard")}><span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span>{user.displayName.split(" ")[0]}</span></button><Button variant="ghost" onClick={logout}>Sign out</Button></> : <><Link className="text-link" to="/login">Sign in</Link><Button onClick={() => navigate("/login")}>Get started</Button></>}</div></header>}
      <main><Outlet /></main>
      <footer className="footer"><span>© 2026 Archer</span><span>Independent work, done thoughtfully.</span></footer>
    </div>
  </div>;
}
