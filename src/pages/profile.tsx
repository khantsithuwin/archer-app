import { ArrowRight, BriefcaseBusiness, Check, UserRound, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, type Category, type User } from "@/lib/api";
import { clientProfilePayload, clientProfileSchema, formatRateInput, freelancerProfilePayload, freelancerProfileSchema, type ClientProfileInput, type FreelancerProfileInput } from "@/lib/onboarding";

type ProfilePayloads = { client?: ReturnType<typeof clientProfilePayload>; freelancer?: ReturnType<typeof freelancerProfilePayload> };

function ProfileEditor({ user, onboarding }: { user: User; onboarding: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isClient = user.modes.includes("CLIENT");
  const isFreelancer = user.modes.includes("FREELANCER");
  const existingFreelancer = user.freelancerProfile;
  const initialCurrency = existingFreelancer?.rateCurrency ?? "USD";
  const [client, setClient] = useState<ClientProfileInput>({
    isCompany: user.clientProfile?.isCompany ?? false,
    companyName: user.clientProfile?.companyName ?? "",
    overview: user.clientProfile?.overview ?? "",
    industry: user.clientProfile?.industry ?? "",
    website: user.clientProfile?.website ?? "",
  });
  const [freelancer, setFreelancer] = useState<FreelancerProfileInput>({
    username: existingFreelancer?.username ?? "",
    title: existingFreelancer?.title ?? "",
    overview: existingFreelancer?.overview ?? "",
    hourlyRate: formatRateInput(existingFreelancer?.hourlyRateMinor, initialCurrency),
    rateCurrency: initialCurrency,
    experienceLevel: existingFreelancer?.experienceLevel ?? "INTERMEDIATE",
    availability: existingFreelancer?.availability ?? "AVAILABLE",
    skillIds: existingFreelancer?.skills?.map((item) => item.skillId) ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api<Category[]>("/categories")).data,
    enabled: isFreelancer,
  });
  const skills = categories?.flatMap((category) => category.skills) ?? [];

  const save = useMutation({
    mutationFn: async (payloads: ProfilePayloads) => {
      if (payloads.client) await api("/client-profile", { method: "PUT", body: JSON.stringify(payloads.client) });
      if (payloads.freelancer) await api("/freelancer-profile", { method: "PUT", body: JSON.stringify(payloads.freelancer) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (onboarding) navigate("/dashboard", { replace: true });
      else setSaved(true);
    },
  });

  const updateClient = <K extends keyof ClientProfileInput,>(key: K, value: ClientProfileInput[K]) => {
    setClient((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [`client.${key}`]: "" }));
    setSaved(false);
  };
  const updateFreelancer = <K extends keyof FreelancerProfileInput,>(key: K, value: FreelancerProfileInput[K]) => {
    setFreelancer((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [`freelancer.${key}`]: "" }));
    setSaved(false);
  };
  const addSkill = (skillId: string) => {
    if (skillId && !freelancer.skillIds.includes(skillId)) updateFreelancer("skillIds", [...freelancer.skillIds, skillId]);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const nextErrors: Record<string, string> = {};
    const payloads: ProfilePayloads = {};
    if (isClient) {
      const parsed = clientProfileSchema.safeParse(client);
      if (parsed.success) payloads.client = clientProfilePayload(parsed.data);
      else for (const issue of parsed.error.issues) nextErrors[`client.${String(issue.path[0])}`] = issue.message;
    }
    if (isFreelancer) {
      const parsed = freelancerProfileSchema.safeParse(freelancer);
      if (parsed.success) payloads.freelancer = freelancerProfilePayload(parsed.data);
      else for (const issue of parsed.error.issues) nextErrors[`freelancer.${String(issue.path[0])}`] = issue.message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) save.mutate(payloads);
  };

  return <section className="page-section narrow-page profile-page">
    <div className="form-heading"><span className="eyebrow">{onboarding ? "Step 2 of 2 · Profile setup" : "Your account"}</span><h1>{onboarding ? "Make your profile yours." : "Your Archer profile."}</h1><p>{onboarding ? "A thoughtful profile helps the right people understand what you do and how you work." : "Keep your details current so your next collaboration starts with clarity."}</p></div>
    <form onSubmit={submit} noValidate>
      {isClient && <Card className="profile-panel"><div className="profile-panel-heading"><span className="audience-icon"><BriefcaseBusiness size={21} /></span><div><h2>Client profile</h2><p>Tell independent talent a little about who they’ll work with.</p></div></div>
        <label className="checkbox-label"><input type="checkbox" checked={client.isCompany} onChange={(event) => updateClient("isCompany", event.target.checked)} /> I’m hiring on behalf of a company</label>
        {client.isCompany && <label>Company name<input value={client.companyName} onChange={(event) => updateClient("companyName", event.target.value)} placeholder="Company or studio name" maxLength={120} />{errors["client.companyName"] && <span className="field-error">{errors["client.companyName"]}</span>}</label>}
        <label>About your work<textarea rows={4} value={client.overview} onChange={(event) => updateClient("overview", event.target.value)} placeholder="What does your team do, and what kind of projects do you work on?" maxLength={2000} />{errors["client.overview"] && <span className="field-error">{errors["client.overview"]}</span>}</label>
        <div className="form-grid"><label>Industry <span className="optional">Optional</span><input value={client.industry} onChange={(event) => updateClient("industry", event.target.value)} placeholder="e.g. Education" maxLength={100} /></label><label>Website <span className="optional">Optional</span><input type="url" value={client.website} onChange={(event) => updateClient("website", event.target.value)} placeholder="https://example.com" />{errors["client.website"] && <span className="field-error">{errors["client.website"]}</span>}</label></div>
      </Card>}

      {isFreelancer && <Card className="profile-panel"><div className="profile-panel-heading"><span className="audience-icon"><UserRound size={21} /></span><div><h2>Freelancer profile</h2><p>Show clients your expertise, availability, and preferred work.</p></div></div>
        <div className="form-grid"><label>Public username<input value={freelancer.username} onChange={(event) => updateFreelancer("username", event.target.value)} placeholder="e.g. alex-lee" maxLength={30} />{errors["freelancer.username"] && <span className="field-error">{errors["freelancer.username"]}</span>}</label><label>Professional title<input value={freelancer.title} onChange={(event) => updateFreelancer("title", event.target.value)} placeholder="e.g. Product designer" maxLength={120} />{errors["freelancer.title"] && <span className="field-error">{errors["freelancer.title"]}</span>}</label></div>
        <label>About your work<textarea rows={5} value={freelancer.overview} onChange={(event) => updateFreelancer("overview", event.target.value)} placeholder="Share your approach, experience, and the kind of work you do best." maxLength={4000} />{errors["freelancer.overview"] && <span className="field-error">{errors["freelancer.overview"]}</span>}</label>
        <div className="form-grid"><label>Hourly rate <span className="optional">Optional</span><input type="text" inputMode="decimal" value={freelancer.hourlyRate} onChange={(event) => updateFreelancer("hourlyRate", event.target.value)} placeholder={freelancer.rateCurrency === "USD" ? "45.00" : "45000"} />{errors["freelancer.hourlyRate"] && <span className="field-error">{errors["freelancer.hourlyRate"]}</span>}</label><label>Rate currency<select value={freelancer.rateCurrency} onChange={(event) => setFreelancer((current) => ({ ...current, rateCurrency: event.target.value as "USD" | "MMK", hourlyRate: "" }))}><option value="USD">USD · US dollars</option><option value="MMK">MMK · Myanmar kyat</option></select></label></div>
        <p className="currency-note">Rates are optional and shown in your chosen currency. Archer does not process payments.</p>
        <div className="form-grid"><label>Experience level<select value={freelancer.experienceLevel} onChange={(event) => updateFreelancer("experienceLevel", event.target.value as FreelancerProfileInput["experienceLevel"])}><option value="ENTRY">Entry</option><option value="INTERMEDIATE">Intermediate</option><option value="EXPERT">Expert</option></select></label><label>Availability<select value={freelancer.availability} onChange={(event) => updateFreelancer("availability", event.target.value as FreelancerProfileInput["availability"])}><option value="AVAILABLE">Available</option><option value="LIMITED">Limited availability</option><option value="UNAVAILABLE">Unavailable</option></select></label></div>
        <label>Skills<select aria-label="Add a skill" value="" disabled={categoriesLoading || categoriesError} onChange={(event) => addSkill(event.target.value)}><option value="">{categoriesLoading ? "Loading skills…" : "Add a skill"}</option>{categories?.map((category) => <optgroup key={category.id} label={category.name}>{category.skills.map((skill) => <option key={skill.id} value={skill.id} disabled={freelancer.skillIds.includes(skill.id)}>{skill.name}</option>)}</optgroup>)}</select>{errors["freelancer.skillIds"] && <span className="field-error">{errors["freelancer.skillIds"]}</span>}</label>
        {categoriesError && <div className="inline-error">Skills could not be loaded. <button type="button" onClick={() => refetchCategories()}>Try again</button></div>}
        {freelancer.skillIds.length > 0 && <div className="selected-skills" aria-label="Selected skills">{freelancer.skillIds.map((skillId) => <span key={skillId}>{skills.find((skill) => skill.id === skillId)?.name ?? "Skill"}<button type="button" aria-label={`Remove ${skills.find((skill) => skill.id === skillId)?.name ?? "skill"}`} onClick={() => updateFreelancer("skillIds", freelancer.skillIds.filter((id) => id !== skillId))}><X size={13} /></button></span>)}</div>}
      </Card>}

      {save.isError && <p className="form-error" role="alert">{save.error.message}</p>}
      {saved && <p className="profile-success" role="status"><Check size={17} /> Your profile has been updated.</p>}
      <div className="profile-actions"><Button type="submit" disabled={save.isPending || (isFreelancer && categoriesLoading)}>{save.isPending ? "Saving profile…" : onboarding ? "Save and enter workspace" : "Save profile"}<ArrowRight size={16} /></Button>{onboarding && <Link to="/dashboard" className="view-all">Do this later</Link>}</div>
    </form>
  </section>;
}

export function ProfilePage({ onboarding = false }: { onboarding?: boolean }) {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) return <section className="page-section"><div className="detail-skeleton" /></section>;
  if (!user) return <section className="page-section"><div className="empty-card"><h2>Sign in to manage your profile</h2><Link to="/login" className="button">Sign in</Link></div></section>;
  return <ProfileEditor key={user.id} user={user} onboarding={onboarding} />;
}
