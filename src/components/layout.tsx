import { useEffect, useState } from "react";
import { ArrowUpRight, Compass, FileText, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authState, normalizeUser, type User } from "@/lib/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me", authState.token],
    queryFn: async () => normalizeUser((await api<User & { modes: (string | { mode: string })[] }>("/auth/me")).data),
    enabled: Boolean(authState.token),
    retry: false,
  });
}

function Brand({ linked = false }: { linked?: boolean }) {
  const mark = <><span className="brand-mark"><ArrowUpRight size={18} strokeWidth={2.7} /></span><span className="brand-word">archer<span className="brand-period">.</span></span></>;
  return linked ? <Link to="/" className="brand" aria-label="Archer home">{mark}</Link> : <span className="brand" aria-label="Archer">{mark}</span>;
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const publicPage = location.pathname === "/" || location.pathname === "/login";
  const showSidebar = Boolean(user) && !publicPage;
  const checkingWorkspace = !publicPage && Boolean(authState.token) && userLoading && !user;
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("archer_sidebar_collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { localStorage.setItem("archer_sidebar_collapsed", String(collapsed)); }, [collapsed]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  const logout = () => {
    authState.token = null;
    queryClient.clear();
    setMobileOpen(false);
    navigate("/");
  };
  const pageLabel = location.pathname.startsWith("/jobs") ? "Find work" : location.pathname.startsWith("/contracts") ? "Contracts" : location.pathname.startsWith("/client") ? "Client workspace" : location.pathname === "/dashboard" ? "Overview" : "Welcome";

  return <div className={"app-shell" + (showSidebar ? " workspace-shell" : " public-shell") + (collapsed ? " sidebar-collapsed" : "") + (mobileOpen && showSidebar ? " mobile-nav-open" : "")}>
    {mobileOpen && showSidebar && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    {showSidebar && <aside className="sidebar" id="primary-sidebar" aria-label="Primary navigation">
      <div className="sidebar-brand"><Brand /><button className="sidebar-toggle" type="button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button><button className="sidebar-mobile-close" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
      <div className="sidebar-group-label">EXPLORE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink to="/dashboard" end title="Overview" onClick={() => setMobileOpen(false)}><LayoutDashboard size={19} /><span className="nav-text">Overview</span></NavLink>
        <NavLink to="/jobs" title="Find work" onClick={() => setMobileOpen(false)}><Compass size={19} /><span className="nav-text">Find work</span></NavLink>
        <NavLink to="/contracts" title="Contracts" onClick={() => setMobileOpen(false)}><FileText size={19} /><span className="nav-text">Contracts</span></NavLink>
      </nav>
      {user?.modes.includes("CLIENT") && <Link to="/client/jobs/new" className="sidebar-create" title="Post a job" onClick={() => setMobileOpen(false)}><Plus size={18} /><span className="nav-text">Post a job</span></Link>}
      <div className="sidebar-spacer" />
      {user && <><Link to="/dashboard" className="sidebar-account" title={user.displayName} onClick={() => setMobileOpen(false)}><span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span className="sidebar-account-name"><strong>{user.displayName}</strong><small>{user.modes.map((mode) => mode.toLowerCase()).join(" · ")}</small></span></Link><button className="sidebar-signout" type="button" title="Sign out" onClick={logout}><LogOut size={17} /><span className="nav-text">Sign out</span></button></>}
    </aside>}

    <div className="app-content">
      {checkingWorkspace ? null : showSidebar ? <header className="topbar"><div className="topbar-inner"><button className="mobile-menu-button" type="button" aria-label="Open navigation" aria-controls="primary-sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={22} /></button><div className="mobile-brand"><Brand /></div><span className="topbar-context">{pageLabel}</span><div className="top-actions"><Link className="header-user" to="/dashboard"><span className="avatar">{user!.displayName.slice(0, 1).toUpperCase()}</span><span>{user!.displayName.split(" ")[0]}</span></Link></div></div></header>
        : <header className="topbar public-topbar"><div className="topbar-inner"><Brand linked /><nav className="public-nav" aria-label="Public navigation"><a href="/#how-it-works">How it works</a></nav><div className="top-actions">{user ? <Link className="public-workspace-link" to="/dashboard">Go to workspace <ArrowUpRight size={16} /></Link> : <><Link className="header-signin" to="/login">Sign in</Link><Link className="button header-cta" to="/login">Get started <ArrowUpRight size={16} /></Link></>}</div></div></header>}
      <main><Outlet /></main>
      <footer className="footer"><span>© 2026 Archer</span><span>Independent work, done thoughtfully.</span></footer>
    </div>
  </div>;
}
