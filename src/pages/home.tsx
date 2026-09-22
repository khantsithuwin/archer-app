import { ArrowRight, BriefcaseBusiness, Check, ClipboardCheck, MessageSquareText, Search, Sparkles, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/components/layout";
import { useI18n } from "@/i18n";

export function HomePage() {
  const { t } = useI18n();
  const { data: user } = useCurrentUser();
  const entryPath = user ? "/dashboard" : "/signup";

  return <>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><span className="eyebrow-dot" /> {t("home.eyebrow")}</span>
        <h1>{t("home.titleBefore")}<br /><span>{t("home.titleAccent")}</span></h1>
        <p>{t("home.intro")}</p>
        <div className="hero-actions"><Link className="button button-large" to={entryPath}>{t("nav.getStarted")} <ArrowRight size={17} /></Link><a className="button button-outline button-large" href="#how-it-works">{t("home.seeHow")}</a></div>
        <div className="hero-proof"><span><Check size={15} /> {t("home.proofBriefs")}</span><span><Check size={15} /> {t("home.proofCurrency")}</span></div>
      </div>
      <div className="hero-visual" aria-label="Overview of the Archer workflow">
        <div className="hero-visual-top"><span className="live-indicator" /> {t("home.workflow")} <span>01 / 03</span></div>
        <div className="hero-preview">
          <div className="preview-header"><span className="preview-icon"><Sparkles size={20} /></span><span className="preview-label">{t("home.collaboration")}</span></div>
          <h2>{t("home.clearerPath")}</h2>
          <p>{t("home.visibleWork")}</p>
          <div className="workflow-steps"><div><span>01</span><strong>{t("home.shareBrief")}</strong><Check size={15} /></div><div><span>02</span><strong>{t("home.startConversation")}</strong><Check size={15} /></div><div><span>03</span><strong>{t("home.moveForward")}</strong><ArrowRight size={16} /></div></div>
          <div className="preview-footer"><span><small>{t("home.sharedProcess")}</small><strong>{t("home.teamsTalent")}</strong></span><span className="preview-arrow"><ArrowRight size={20} /></span></div>
        </div>
        <div className="visual-caption"><span className="caption-line" /> {t("home.betterBeginning")}</div>
      </div>
    </section>

    <section className="value-strip" aria-label="Archer principles"><span>{t("home.principleClear")}</span><span>{t("home.principleProposals")}</span><span>{t("home.principleProgress")}</span></section>

    <section className="section audience-section">
      <div className="section-heading"><div><span className="eyebrow">{t("home.betterWay")}</span><h2>{t("home.bothSides")}</h2><p>{t("home.bothSidesBody")}</p></div></div>
      <div className="audience-grid">
        <div className="audience-card"><span className="audience-icon"><BriefcaseBusiness size={23} /></span><h3>{t("home.forClients")}</h3><p>{t("home.clientsBody")}</p><div className="audience-points"><span><Check size={15} /> {t("home.clientPoint1")}</span><span><Check size={15} /> {t("home.clientPoint2")}</span><span><Check size={15} /> {t("home.clientPoint3")}</span></div><Link to={user ? "/dashboard" : "/signup?role=client"} className="view-all">{t("home.startProject")} <ArrowRight size={16} /></Link></div>
        <div className="audience-card"><span className="audience-icon"><UsersRound size={23} /></span><h3>{t("home.forFreelancers")}</h3><p>{t("home.freelancersBody")}</p><div className="audience-points"><span><Check size={15} /> {t("home.freelancerPoint1")}</span><span><Check size={15} /> {t("home.freelancerPoint2")}</span><span><Check size={15} /> {t("home.freelancerPoint3")}</span></div><Link to={user ? "/dashboard" : "/signup?role=freelancer"} className="view-all">{t("home.nextProject")} <ArrowRight size={16} /></Link></div>
      </div>
    </section>

    <section className="section process-section" id="how-it-works">
      <div className="section-heading"><div><span className="eyebrow">{t("home.how")}</span><h2>{t("home.fromTo")}</h2></div></div>
      <div className="process-grid">
        <div className="process-item"><span className="process-number">01</span><Search size={23} /><h3>{t("home.discover")}</h3><p>{t("home.discoverBody")}</p></div>
        <div className="process-item"><span className="process-number">02</span><MessageSquareText size={23} /><h3>{t("home.connect")}</h3><p>{t("home.connectBody")}</p></div>
        <div className="process-item"><span className="process-number">03</span><ClipboardCheck size={23} /><h3>{t("home.deliver")}</h3><p>{t("home.deliverBody")}</p></div>
      </div>
    </section>

    <section className="closing-section"><div><span className="eyebrow">{t("home.ready")}</span><h2>{t("home.makeRoom")}</h2><p>{t("home.join")}</p></div><Link className="button button-light button-large" to={entryPath}>{t("home.enter")} <ArrowRight size={17} /></Link></section>
  </>;
}
