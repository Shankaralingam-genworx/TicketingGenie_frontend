import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const steps = [
  { n: '01', t: 'Submit', d: 'Via web portal or inbound email.' },
  { n: '02', t: 'Classify', d: 'Auto-assigned severity & priority.' },
  { n: '03', t: 'Assign', d: 'Routed to the right agent instantly.' },
  { n: '04', t: 'Resolve', d: 'SLA tracked. Customer notified.' },
];



const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
          <div className="hbg-dots" />
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-pill">
            <span className="hero-pill-dot" />
            AI-Powered Support
          </div>
          <h1 className="lp-hero-h1">
            Resolve every ticket.<br />
            <em>Miss nothing.</em>
          </h1>
          <p className="lp-hero-p">
            AI-classified tickets, SLA enforcement, and full lifecycle
            tracking — giving your team clarity on every issue.
          </p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Go to your portal <Arrow />
          </button>
        </div>

        <div className="lp-hero-card-wrap">
          <TicketCard />
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats">

      </section>

      {/* WORKFLOW */}
      <section className="lp-workflow">
        <div className="lp-workflow-inner">
          <span className="section-tag">How it works</span>
          <h2 className="section-h2">From submission <em>to resolution</em></h2>
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
          <h2 className="lp-cta-h2">Ready to get started?</h2>
          <p className="lp-cta-p">Sign in to your portal and manage tickets with speed and clarity.</p>
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

/* ─── Micro-components ─── */
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
      <div className="tc-dots"><span /><span /><span /></div>
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