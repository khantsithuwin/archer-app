import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/layout";
import { JobForm } from "@/components/job-form";
import { api } from "@/lib/api";
import type { jobFormPayload } from "@/lib/job-form";
import { useI18n } from "@/i18n";

export function CreateJobPage() {
  const { t } = useI18n();
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

  if (!user?.modes.includes("CLIENT")) return <section className="page-section narrow-page"><div className="empty-card"><h1>{t("post.clientRequired")}</h1><p>{t("post.clientRequiredBody")}</p><Link to="/dashboard" className="button">{t("common.backWorkspace")}</Link></div></section>;

  return <section className="page-section narrow-page"><Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> {t("common.backWorkspace")}</Link><div className="form-heading"><span className="eyebrow">{t("post.eyebrow")}</span><h1>{t("post.title")}</h1><p>{t("post.subtitle")}</p></div><JobForm onSave={(payload) => mutation.mutate(payload)} busy={mutation.isPending} error={mutation.error?.message} submitLabel={t("post.saveDraft")} /></section>;
}
