import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

/* ─── Data ────────────────────── */
const features = [
  {
    num: '01',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
    title: 'Smart Ticket Creation',
    desc: 'Submit via web portal or email. Rule-based AI auto-assigns severity — Critical, High, Medium, or Low — with zero manual triage.',
  },
  {
    num: '02',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>,
    title: 'LangGraph AI Pipeline',
    desc: 'Email-triggered LangGraph workflow: parse → classify → deduplicate → persist → notify. Fully automated, fully observable.',
  },
  {
    num: '03',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" /></svg>,
    title: 'SLA Enforcement',
    desc: 'Per-severity SLA thresholds configured exclusively by Admin. Automatic breach detection escalates to Team Lead instantly.',
  },
  {
    num: '04',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
    title: 'Lifecycle Tracking',
    desc: 'Full state-machine: New → Acknowledged → Open → In Progress → Resolved → Closed. Enforced transitions with no shortcuts.',
  },
  {
    num: '05',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    title: 'Role-Based Access',
    desc: 'Four distinct portals — Customer, Agent, Team Lead, Admin — scoped precisely and secured with JWT, no permission bleed.',
  },
  {
    num: '06',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
    title: 'Admin Analytics',
    desc: 'SLA compliance metrics, agent performance, ticket velocity — all on a real-time dashboard backed by immutable audit logs.',
  },
];

const steps = [
  { n: '1', t: 'Ticket Submitted', d: 'Customer creates a ticket via web portal or sends an inbound email to the monitored inbox.' },
  { n: '2', t: 'AI Classification', d: 'LangGraph pipeline: parse input → detect severity → map priority → check for duplicates.' },
  { n: '3', t: 'Auto-Assignment', d: 'System selects the best available agent based on priority level and current workload.' },
  { n: '4', t: 'SLA Monitoring', d: 'Engine tracks first response and resolution times against per-severity configured thresholds.' },
  { n: '5', t: 'Resolved & Closed', d: 'Agent resolves; customer notified via email. All actions logged in the immutable audit trail.' },
];

const stats = [
  { value: '99.9%', label: 'SLA Uptime' },
  { value: '<2 min', label: 'Avg. Assignment' },
  { value: '4 Roles', label: 'Access Tiers' },
  { value: '8 States', label: 'Lifecycle Steps' },
];

/* ─── Main Component ─────────────── */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = Number(e.target.getAttribute('data-i'));
          setVisible((p) => new Set([...p, i]));
        }
      }),
      { threshold: 0.12 }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp">

      {/* NAV */}
      <nav className={`lp-nav${scrolled ? ' lp-nav--up' : ''}`}>
        <div className="lp-nav-inner">
          <a className="lp-logo" href="/">
            <LogoIcon />
            Ticketing<em>Genie</em>
          </a>
          <ul className="lp-nav-links">
          </ul>
          <button className="lp-nav-btn" onClick={() => navigate('/login')}>
            Sign In <Arrow />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="hbg-circle hbg-c1" />
          <div className="hbg-circle hbg-c2" />
          <div className="hbg-ring hbg-r1" />
          <div className="hbg-ring hbg-r2" />
          <div className="hbg-dots" />
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-pill">
            <span className="hero-pill-dot" />
            AI-Powered Support Operations
          </div>
          <h1 className="lp-hero-h1">
            Resolve every ticket.<br />
            <em>Miss nothing.</em>
          </h1>
          <p className="lp-hero-p">
            Ticketing Genie centralises your support operations — from AI-classified
            email tickets to SLA-enforced escalations — giving your team complete
            visibility and control over every issue.
          </p>
          <div className="lp-hero-btns">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Go to your portal <Arrow />
            </button>
          </div>
        </div>

        <div className="lp-hero-card-wrap">
          <TicketCard />
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="lp-workflow" id="workflow">
        <div className="lp-workflow-inner">
          <div className="lp-section-hdr lp-section-hdr--left">
            <span className="section-tag">Workflow</span>
            <h2 className="section-h2">
              From submission<br /><em>to resolution</em>
            </h2>
          </div>
          <div className="wf-steps">
            {steps.map((s, i) => (
              <div className="wf-step" key={s.n}>
                <div className="wf-num">{s.n}</div>
                <div className="wf-body">
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                </div>
                {i < steps.length - 1 && <div className="wf-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <span className="section-tag section-tag--light">Ready?</span>
          <h2 className="lp-cta-h2">
            Your team deserves<br /><em>smarter support tools.</em>
          </h2>
          <p className="lp-cta-p">
            Sign in to your portal and start managing tickets with clarity,
            speed, and full accountability.
          </p>
          <button className="btn-cta" onClick={() => navigate('/login')}>
            Sign in to Ticketing Genie
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a className="lp-logo" href="/">
            <LogoIcon size={24} />
            Ticketing<em>Genie</em>
          </a>
          <p>AI-powered support ticket management. Built for teams that care.</p>
          <div className="lp-footer-badges">
            {['JWT Secured', 'SLA Enforced', 'Audit Ready'].map((b) => (
              <span key={b} className="footer-badge">{b}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Shared micro-components ──── */
const LogoIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
    <rect width="40" height="40" rx="10" fill="url(#lg)" />
    <path d="M12 20H28M12 14H22M12 26H20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9D65F5" />
        <stop offset="1" stopColor="#3D1F8C" />
      </linearGradient>
    </defs>
  </svg>
);

const Arrow: React.FC = () => (
  <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 7h10M8 3l4 4-4 4" />
  </svg>
);

const TicketCard: React.FC = () => (
  <div className="tc">
    <div className="tc-header">
      <div className="tc-dots">
        <span /><span /><span />
      </div>
      <span className="tc-id">TG-3142</span>
      <span className="tc-crit">Critical</span>
    </div>
    <div className="tc-body">
      <p className="tc-subject">Payment gateway timeout on checkout flow</p>
      <div className="tc-rows">
        <div className="tc-row">
          <span className="tc-key">Status</span>
          <span className="tc-val tc-inprogress">
            <span className="tc-dot-live" /> In Progress
          </span>
        </div>
        <div className="tc-row">
          <span className="tc-key">Agent</span>
          <span className="tc-val tc-agent">
            <span className="tc-av">JS</span> Jake Sullivan
          </span>
        </div>
        <div className="tc-row">
          <span className="tc-key">SLA</span>
          <div className="tc-sla">
            <div className="tc-sla-bar"><div className="tc-sla-fill" /></div>
            <span>4h 12m remaining</span>
          </div>
        </div>
      </div>
      <div className="tc-timeline">
        {['New', 'Ack.', 'Open', 'In Prog.', 'Resolved', 'Closed'].map((s, i) => (
          <div key={s} className={`tc-step${i < 4 ? ' tc-step--done' : ''}`}>
            <div className="tc-step-dot" /><span>{s}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="tc-ai">
      <svg viewBox="0 0 12 12" fill="currentColor" style={{ width: 10, height: 10 }}>
        <path d="M6 0l1.2 2.8L10 4 7.2 6.2l.8 3.8-2-1.8L4 10l.8-3.8L2 4l2.8-1.2z" />
      </svg>
      AI classified · 0.3s
    </div>
  </div>
);

export default LandingPage;
