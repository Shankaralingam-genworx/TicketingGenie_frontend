import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { logoutThunk } from '@/features/auth/slices/authSlice';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import { LogoIcon, LogoutIcon } from '@/components/icons';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';
import '@/styles/Dashboard.css';

const TicketIcon = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3M13 3h4v4M13 7l4-4M7 9h6M7 12h4" /></svg>;

const NAV = [{ label: 'My Tickets', icon: <TicketIcon />, to: 'tickets' }];
const ACCENT = '#1D4ED8';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user  = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  useSessionExpiry();     
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'CU';
  const handleLogout = async () => { await dispatch(logoutThunk()); navigate('/login', { replace: true }); };

  return (
    <div className="dash">
      <header className="dash-topbar">
        <a className="dash-topbar-logo" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}><LogoIcon />Ticketing<em>Genie</em></a>
        <div className="dash-topbar-divider" />
        <span className="dash-topbar-title">Customer Portal</span>
        <div className="dash-topbar-right">
          <NotificationBell token={token} accentColor={ACCENT}
            onNavigate={(_tid, tnum) => { tnum === '__all_notifications__' ? navigate('notifications') : navigate('tickets'); }}
          />
          <span className="dash-role-badge dash-role-badge--customer">Customer</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', cursor: 'pointer' }} onClick={() => navigate('profile')}>{user?.email}</span>
          <div className="dash-avatar" onClick={() => navigate('profile')} title="Go to Profile">{initials}</div>
          <button className="dash-logout-btn" onClick={handleLogout}><LogoutIcon /> Sign out</button>
        </div>
      </header>
      <aside className="dash-sidebar">
        <span className="dash-nav-label">Support</span>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `dash-nav-item${isActive ? ' dash-nav-item--active' : ''}`}>
            {n.icon}{n.label}
          </NavLink>
        ))}
      </aside>
      <main className="dash-main"><Outlet /></main>
    </div>
  );
}
