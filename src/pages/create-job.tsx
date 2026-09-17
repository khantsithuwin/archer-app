import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/layout";
import { JobForm } from "@/components/job-form";
import { api } from "@/lib/api";
import type { jobFormPayload } from "@/lib/job-form";

export function CreateJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const mutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof jobFormPayload>) => (await api<{ id: string }>("/jobs", { method: "POST", body: JSON.stringify(payload) })).data,
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      navigate(`/client/jobs/${job.id}`);
    },
  });

  if (!user?.modes.includes("CLIENT")) return <section className="page-section narrow-page"><div className="empty-card"><h1>Client access required</h1><p>Only client accounts can post jobs.</p><Link to="/dashboard" className="button">Back to workspace</Link></div></section>;

  return <section className="page-section narrow-page"><Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to workspace</Link><div className="form-heading"><span className="eyebrow">New opportunity</span><h1>What would you like to make?</h1><p>Start with a clear brief. Your job stays private as a draft until you publish it.</p></div><JobForm onSave={(payload) => mutation.mutate(payload)} busy={mutation.isPending} error={mutation.error?.message} submitLabel="Create draft" /></section>;
}
