import { useEffect, useState } from "react";
import { ArrowUpRight, Compass, FileText, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, UserRound, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authState, normalizeUser, type User } from "@/lib/api";
import { enumLabel, firstGrapheme, useI18n } from "@/i18n";

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
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const publicPage = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup";
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
  const pageLabel = location.pathname.startsWith("/jobs") ? t("nav.findWork") : location.pathname.startsWith("/contracts") ? t("nav.contracts") : location.pathname.startsWith("/client") ? t("nav.clientWorkspace") : location.pathname === "/dashboard" ? t("nav.overview") : location.pathname === "/onboarding" ? t("nav.profileSetup") : location.pathname === "/profile" ? t("nav.profile") : t("nav.welcome");
  const languageSwitch = <label className="language-switch"><span className="sr-only">{t("language.switch")}</span><select aria-label={t("language.switch")} value={locale} onChange={(event) => setLocale(event.target.value as "en" | "my")}><option value="en">EN</option><option value="my">မြန်မာ</option></select></label>;

  return <div className={"app-shell" + (showSidebar ? " workspace-shell" : " public-shell") + (collapsed ? " sidebar-collapsed" : "") + (mobileOpen && showSidebar ? " mobile-nav-open" : "")}>
    {mobileOpen && showSidebar && <button className="sidebar-backdrop" type="button" aria-label={t("nav.close")} onClick={() => setMobileOpen(false)} />}
    {showSidebar && <aside className="sidebar" id="primary-sidebar" aria-label={t("nav.explore")}>
      <div className="sidebar-brand"><Brand /><button className="sidebar-toggle" type="button" aria-label={collapsed ? t("nav.expand") : t("nav.collapse")} title={collapsed ? t("nav.expand") : t("nav.collapse")} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button><button className="sidebar-mobile-close" type="button" aria-label={t("nav.close")} onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
      <div className="sidebar-group-label">{t("nav.explore")}</div>
      <nav className="sidebar-nav" aria-label={t("nav.explore")}>
        <NavLink to="/dashboard" end title={t("nav.overview")} onClick={() => setMobileOpen(false)}><LayoutDashboard size={19} /><span className="nav-text">{t("nav.overview")}</span></NavLink>
        <NavLink to="/jobs" title={t("nav.findWork")} onClick={() => setMobileOpen(false)}><Compass size={19} /><span className="nav-text">{t("nav.findWork")}</span></NavLink>
        <NavLink to="/contracts" title={t("nav.contracts")} onClick={() => setMobileOpen(false)}><FileText size={19} /><span className="nav-text">{t("nav.contracts")}</span></NavLink>
        <NavLink to="/profile" title={t("nav.profile")} onClick={() => setMobileOpen(false)}><UserRound size={19} /><span className="nav-text">{t("nav.profile")}</span></NavLink>
      </nav>
      {user?.modes.includes("CLIENT") && <Link to="/client/jobs/new" className="sidebar-create" title={t("nav.postJob")} onClick={() => setMobileOpen(false)}><Plus size={18} /><span className="nav-text">{t("nav.postJob")}</span></Link>}
      <div className="sidebar-spacer" />
      {user && <><Link to="/profile" className="sidebar-account" title={user.displayName} onClick={() => setMobileOpen(false)}><span className="avatar">{firstGrapheme(user.displayName, locale).toLocaleUpperCase(locale)}</span><span className="sidebar-account-name"><strong>{user.displayName}</strong><small>{user.modes.map((mode) => enumLabel(mode, locale)).join(" · ")}</small></span></Link><button className="sidebar-signout" type="button" title={t("nav.signOut")} onClick={logout}><LogOut size={17} /><span className="nav-text">{t("nav.signOut")}</span></button></>}
    </aside>}

    <div className="app-content">
      {checkingWorkspace ? null : showSidebar ? <header className="topbar"><div className="topbar-inner"><button className="mobile-menu-button" type="button" aria-label={t("nav.open")} aria-controls="primary-sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={22} /></button><div className="mobile-brand"><Brand /></div><span className="topbar-context">{pageLabel}</span><div className="top-actions">{languageSwitch}<Link className="header-user" to="/profile"><span className="avatar">{firstGrapheme(user!.displayName, locale).toLocaleUpperCase(locale)}</span><span>{user!.displayName.split(" ")[0]}</span></Link></div></div></header>
        : <header className="topbar public-topbar"><div className="topbar-inner"><Brand linked /><nav className="public-nav" aria-label={t("nav.howItWorks")}><a href="/#how-it-works">{t("nav.howItWorks")}</a></nav><div className="top-actions">{languageSwitch}{user ? <Link className="public-workspace-link" to="/dashboard">{t("nav.workspace")} <ArrowUpRight size={16} /></Link> : <><Link className="header-signin" to="/login">{t("nav.signIn")}</Link><Link className="button header-cta" to="/signup">{t("nav.getStarted")} <ArrowUpRight size={16} /></Link></>}</div></div></header>}
      <main><Outlet /></main>
      <footer className="footer"><span>© 2026 Archer</span><span>{t("footer.tagline")}</span></footer>
    </div>
  </div>;
}
