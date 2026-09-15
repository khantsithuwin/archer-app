import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { JobsPage } from "@/pages/jobs";
import { JobDetailPage } from "@/pages/job-detail";
import { LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/dashboard";
import { CreateJobPage } from "@/pages/create-job";
import { ProposalsPage } from "@/pages/proposals";
import { ContractDetailPage, ContractsPage } from "@/pages/contracts";
import "./index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });
const router = createBrowserRouter([{ path: "/", element: <Layout />, children: [{ index: true, element: <HomePage /> }, { path: "jobs", element: <JobsPage /> }, { path: "jobs/:jobId", element: <JobDetailPage /> }, { path: "login", element: <LoginPage /> }, { path: "dashboard", element: <DashboardPage /> }, { path: "client/jobs/new", element: <CreateJobPage /> }, { path: "client/jobs/:jobId/proposals", element: <ProposalsPage /> }, { path: "contracts", element: <ContractsPage /> }, { path: "contracts/:contractId", element: <ContractDetailPage /> }, { path: "*", element: <Navigate to="/" replace /> }] }]);

createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>);
