import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, FileStack, LayoutDashboard, LogIn, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, authState, normalizeUser, type User } from "@/lib/api";

export function useCurrentUser() { return useQuery({ queryKey: ["me", authState.token], queryFn: async () => normalizeUser((await api<User & { modes: (string | { mode: string })[] }>("/auth/me")).data), enabled: Boolean(authState.token), retry: false }); }

export function Layout() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = () => { authState.token = null; navigate("/"); };
  return <div className="app-shell">
    <aside className="sidebar">
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
    </aside>
    <div className="app-content">
      <header className="mobile-topbar"><Link to="/" className="brand"><span className="brand-mark">↗</span><span>archer</span></Link>{user ? <button className="user-chip" onClick={() => navigate("/dashboard")}><span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span></button> : <Link className="mobile-signin" to="/login">Sign in</Link>}</header>
      <main><Outlet /></main>
      <footer className="footer"><span>© 2026 Archer</span><span>Independent work, done thoughtfully.</span></footer>
    </div>
  </div>;
}
