import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { Layout, useCurrentUser } from "@/components/layout";
import { authState } from "@/lib/api";
import { HomePage } from "@/pages/home";
import { JobsPage } from "@/pages/jobs";
import { JobDetailPage } from "@/pages/job-detail";
import { LoginPage } from "@/pages/login";
import { SignUpPage } from "@/pages/signup";
import { ProfilePage } from "@/pages/profile";
import { DashboardPage } from "@/pages/dashboard";
import { CreateJobPage } from "@/pages/create-job";
import { ClientJobPage } from "@/pages/client-job";
import { ProposalsPage } from "@/pages/proposals";
import { MyProposalPage } from "@/pages/my-proposal";
import { ContractDetailPage, ContractsPage } from "@/pages/contracts";
import "./index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

function RequireAuth() {
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();
  const returnTo = location.pathname + location.search;

  if (!authState.token) return <Navigate to="/login" replace state={{ from: returnTo }} />;
  if (isLoading) return <section className="page-section"><div className="detail-skeleton" aria-label="Loading workspace" /></section>;
  if (!user) return <Navigate to="/login" replace state={{ from: returnTo }} />;
  return <Outlet />;
}

function LandingRoute() {
  const { data: user, isLoading } = useCurrentUser();
  if (authState.token && isLoading) return <section className="page-section"><div className="detail-skeleton" aria-label="Checking session" /></section>;
  return user ? <Navigate to="/dashboard" replace /> : <HomePage />;
}

function GuestOnly() {
  const { data: user, isLoading } = useCurrentUser();
  if (authState.token && isLoading) return <section className="page-section"><div className="detail-skeleton" aria-label="Checking session" /></section>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

const router = createBrowserRouter([{ path: "/", element: <Layout />, children: [
  { index: true, element: <LandingRoute /> },
  { element: <GuestOnly />, children: [
    { path: "login", element: <LoginPage /> },
    { path: "signup", element: <SignUpPage /> },
  ] },
  { element: <RequireAuth />, children: [
    { path: "onboarding", element: <ProfilePage onboarding /> },
    { path: "profile", element: <ProfilePage /> },
    { path: "jobs", element: <JobsPage /> },
    { path: "jobs/:jobId", element: <JobDetailPage /> },
    { path: "dashboard", element: <DashboardPage /> },
    { path: "client/jobs/new", element: <CreateJobPage /> },
    { path: "client/jobs/:jobId", element: <ClientJobPage /> },
    { path: "client/jobs/:jobId/proposals", element: <ProposalsPage /> },
    { path: "proposals/:proposalId", element: <MyProposalPage /> },
    { path: "contracts", element: <ContractsPage /> },
    { path: "contracts/:contractId", element: <ContractDetailPage /> },
  ] },
  { path: "*", element: <Navigate to="/" replace /> },
] }]);

createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>);
