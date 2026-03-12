/**
 * AgentDashboard — Support Agent shell layout.
 * File: src/features/dashboard/pages/AgentDashboard.tsx
 */

import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { logoutThunk } from '../../auth/slices/authSlice';
import NotificationBell from '../../notifications/components/NotificationBell';
import '../../../styles/Dashboard.css';

// ── Icons ─────────────────────────────────────────────────────────────────────

const LogoIcon   = () => <svg width="26" height="26" viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}><rect width="40" height="40" rx="10" fill="url(#ag-lg)" /><path d="M12 20H28M12 14H22M12 26H20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /><defs><linearGradient id="ag-lg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#34D399" /><stop offset="1" stopColor="#059669" /></linearGradient></defs></svg>;
const TicketIcon = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3M13 3h4v4M13 7l4-4M7 9h6M7 12h4" /></svg>;
const LogoutIcon = () => <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16l4-6-4-6M17 10H7M3 4v12" /></svg>;

// ── Nav config — Profile removed (accessible via topbar avatar) ───────────────

const NAV = [
  { label: 'My Tickets', icon: <TicketIcon />, to: 'tickets' },
];

const ACCENT = '#059669';

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user  = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);

  const initials     = user?.email ? user.email.slice(0, 2).toUpperCase() : 'AG';
  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  return (
    <div className="dash">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="dash-topbar">
        <Link className="dash-topbar-logo" to="/"><LogoIcon />Ticketing<em>Genie</em></Link>
        <div className="dash-topbar-divider" />
        <span className="dash-topbar-title">Agent Portal</span>

        <div className="dash-topbar-right">
          <NotificationBell
            token={token}
            accentColor={ACCENT}
            onNavigate={(_ticketId, ticketNumber) => {
              if (ticketNumber === '__all_notifications__') {
                navigate('notifications');
              } else {
                navigate('tickets');
              }
            }}
          />

          <span className="dash-role-badge" style={{ background: '#ECFDF5', color: '#065F46' }}>
            Support Agent
          </span>

          {/* Clickable email + avatar → profile */}
          <span
            style={{ fontSize: '0.8rem', color: 'var(--slate-400)', cursor: 'pointer' }}
            onClick={() => navigate('profile')}
            title="Go to Profile"
          >
            {user?.email}
          </span>
          <div
            className="dash-avatar"
            style={{ background: 'linear-gradient(135deg,#34D399,#059669)' }}
            onClick={() => navigate('profile')}
            title="Go to Profile"
          >
            {initials}
          </div>

          <button className="dash-logout-btn" onClick={handleLogout}>
            <LogoutIcon /> Sign out
          </button>
        </div>
      </header>

      {/* ── Sidebar — only My Tickets ─────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <span className="dash-nav-label">Workspace</span>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) => `dash-nav-item${isActive ? ' dash-nav-item--active' : ''}`}>
            {n.icon}{n.label}
          </NavLink>
        ))}
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}