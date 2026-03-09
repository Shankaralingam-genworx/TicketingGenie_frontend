/**
 * LeadDashboard — Team Lead shell layout.
 * File: src/features/dashboard/pages/LeadDashboard.tsx
 *
 * Changes from previous version:
 *   - "SLA Dashboard" nav item removed (SLA time is now live in every page)
 *   - "Agents" nav item added  → /lead/agents
 */
import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import '../../../styles/Dashboard.css';
import { logoutThunk } from '../../auth/slices/authSlice';

const LogoIcon   = () => <svg width="26" height="26" viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}><rect width="40" height="40" rx="10" fill="url(#ld-lg)"/><path d="M12 20H28M12 14H22M12 26H20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/><defs><linearGradient id="ld-lg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#A78BFA"/><stop offset="1" stopColor="#6D28D9"/></linearGradient></defs></svg>;
const TicketIcon = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3M13 3h4v4M13 7l4-4M7 9h6M7 12h4"/></svg>;
const QueueIcon  = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h12M4 10h8M4 14h5"/></svg>;
const AgentsIcon = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM6 16a6 6 0 1112 0H2a6 6 0 016 0z"/></svg>;
const UserIcon   = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/></svg>;
const LogoutIcon = () => <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16l4-6-4-6M17 10H7M3 4v12"/></svg>;

const NAV = [
  { label: 'Team Queue',  icon: <QueueIcon />,  to: 'queue'   },
  { label: 'All Tickets', icon: <TicketIcon />, to: 'tickets' },
  { label: 'Agents',      icon: <AgentsIcon />, to: 'agents'  },
  { label: 'Profile',     icon: <UserIcon />,   to: 'profile' },
];

export default function LeadDashboard() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const user      = useAppSelector((s) => s.auth.user);
  const initials  = user?.email ? user.email.slice(0, 2).toUpperCase() : 'TL';

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  return (
    <div className="dash">
      <header className="dash-topbar">
        <Link className="dash-topbar-logo" to="/"><LogoIcon />Ticketing<em>Genie</em></Link>
        <div className="dash-topbar-divider" />
        <span className="dash-topbar-title">Team Lead Portal</span>
        <div className="dash-topbar-right">
          <span className="dash-role-badge" style={{ background: '#F5F3FF', color: '#5B21B6' }}>
            Team Lead
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{user?.email}</span>
          <div className="dash-avatar" style={{ background: 'linear-gradient(135deg,#A78BFA,#6D28D9)' }}>
            {initials}
          </div>
          <button className="dash-logout-btn" onClick={handleLogout}>
            <LogoutIcon /> Sign out
          </button>
        </div>
      </header>

      <aside className="dash-sidebar">
        <span className="dash-nav-label">Management</span>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) => `dash-nav-item${isActive ? ' dash-nav-item--active' : ''}`}>
            {n.icon}{n.label}
          </NavLink>
        ))}
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}