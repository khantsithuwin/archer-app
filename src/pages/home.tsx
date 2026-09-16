import { ArrowRight, BriefcaseBusiness, Check, ClipboardCheck, MessageSquareText, Search, Sparkles, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/components/layout";

export function HomePage() {
  const { data: user } = useCurrentUser();
  const entryPath = user ? "/dashboard" : "/signup";

  return <>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><span className="eyebrow-dot" /> Independent work, made clearer</span>
        <h1>Great work starts<br />with the <span>right connection.</span></h1>
        <p>Archer is a thoughtful place for independent talent and ambitious teams to meet, agree on the work, and move forward together.</p>
        <div className="hero-actions"><Link className="button button-large" to={entryPath}>Get started <ArrowRight size={17} /></Link><a className="button button-outline button-large" href="#how-it-works">See how it works</a></div>
        <div className="hero-proof"><span><Check size={15} /> Clear briefs and proposals</span><span><Check size={15} /> Project budgets in USD and MMK</span></div>
      </div>
      <div className="hero-visual" aria-label="Overview of the Archer workflow">
        <div className="hero-visual-top"><span className="live-indicator" /> THE ARCHER WORKFLOW <span>01 / 03</span></div>
        <div className="hero-preview">
          <div className="preview-header"><span className="preview-icon"><Sparkles size={20} /></span><span className="preview-label">BUILT FOR BETTER COLLABORATION</span></div>
          <h2>A clearer path from idea to outcome.</h2>
          <p>Keep the important parts of working together visible from the first conversation to the final handoff.</p>
          <div className="workflow-steps"><div><span>01</span><strong>Share the brief</strong><Check size={15} /></div><div><span>02</span><strong>Start a conversation</strong><Check size={15} /></div><div><span>03</span><strong>Move the work forward</strong><ArrowRight size={16} /></div></div>
          <div className="preview-footer"><span><small>ONE SHARED PROCESS</small><strong>For teams and independent talent</strong></span><span className="preview-arrow"><ArrowRight size={20} /></span></div>
        </div>
        <div className="visual-caption"><span className="caption-line" /> Good work deserves a better beginning.</div>
      </div>
    </section>

    <section className="value-strip" aria-label="Archer principles"><span>Built for clear collaboration</span><span>Thoughtful proposals</span><span>Visible project progress</span></section>

    <section className="section audience-section">
      <div className="section-heading"><div><span className="eyebrow">A better way to work</span><h2>Built for both sides of the work.</h2><p>Whether you’re finding someone or finding your next project, clarity makes all the difference.</p></div></div>
      <div className="audience-grid">
        <div className="audience-card"><span className="audience-icon"><BriefcaseBusiness size={23} /></span><h3>For clients</h3><p>Describe what you need, compare thoughtful proposals, and keep project progress in one place.</p><div className="audience-points"><span><Check size={15} /> Share a clear project brief</span><span><Check size={15} /> Review relevant proposals</span><span><Check size={15} /> Track agreed milestones</span></div><Link to={user ? "/dashboard" : "/signup?role=client"} className="view-all">Start a project <ArrowRight size={16} /></Link></div>
        <div className="audience-card"><span className="audience-icon"><UsersRound size={23} /></span><h3>For freelancers</h3><p>Discover work that fits your skills, make your case, and stay aligned from agreement to delivery.</p><div className="audience-points"><span><Check size={15} /> Find relevant opportunities</span><span><Check size={15} /> Send your best proposal</span><span><Check size={15} /> Manage active work</span></div><Link to={user ? "/dashboard" : "/signup?role=freelancer"} className="view-all">Find your next project <ArrowRight size={16} /></Link></div>
      </div>
    </section>

    <section className="section process-section" id="how-it-works">
      <div className="section-heading"><div><span className="eyebrow">How Archer works</span><h2>From first conversation to finished work.</h2></div></div>
      <div className="process-grid">
        <div className="process-item"><span className="process-number">01</span><Search size={23} /><h3>Discover</h3><p>Find the right people and projects within a focused workspace.</p></div>
        <div className="process-item"><span className="process-number">02</span><MessageSquareText size={23} /><h3>Connect</h3><p>Start with a clear brief, share a thoughtful proposal, and agree on the scope.</p></div>
        <div className="process-item"><span className="process-number">03</span><ClipboardCheck size={23} /><h3>Deliver</h3><p>Track the work, review milestones, and keep the next step visible.</p></div>
      </div>
    </section>

    <section className="closing-section"><div><span className="eyebrow">Ready when you are</span><h2>Make room for better work.</h2><p>Join a marketplace built around the quality of the collaboration.</p></div><Link className="button button-light button-large" to={entryPath}>Enter Archer <ArrowRight size={17} /></Link></section>
  </>;
}
