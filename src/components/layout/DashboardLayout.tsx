/**
 * components/layout/DashboardLayout.tsx
 *
 * Shared shell for ALL role dashboards (Admin, Agent, TeamLead, Customer).
 * Renders the topbar + sidebar + main content slot.
 *
 * Usage:
 *   <DashboardLayout
 *     title="Admin Control Panel"
 *     role="admin"
 *     nav={NAV_ITEMS}
 *     activeId={active}
 *     onNavChange={setActive}
 *     user={user}
 *     token={token}
 *     onLogout={handleLogout}
 *     onProfileClick={() => setShowProfile(true)}
 *     sidebarExtra={<div>...</div>}  // optional
 *   >
 *     <MyPageContent />
 *   </DashboardLayout>
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon, LogoutIcon } from '@/components/icons';
import type { UserRole } from '@/types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  /** Short title shown in topbar next to the logo divider */
  title: string;
  /** Role label shown as a badge */
  role: UserRole;
  nav: NavItem[];
  activeId: string;
  onNavChange: (id: string) => void;
  user: { email: string; name?: string } | null;
  token?: string | null;
  onLogout: () => void;
  onProfileClick?: () => void;
  /** Anything rendered at the bottom of the sidebar */
  sidebarExtra?: React.ReactNode;
  /** Anything rendered to the right of the role badge in the topbar */
  topbarRight?: React.ReactNode;
  children: React.ReactNode;
}

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin:         'dash-role-badge--admin',
  team_lead:     'dash-role-badge--lead',
  support_agent: 'dash-role-badge--agent',
  customer:      'dash-role-badge--customer',
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin:         'Admin',
  team_lead:     'Team Lead',
  support_agent: 'Agent',
  customer:      'Customer',
};

const DashboardLayout: React.FC<Props> = ({
  title,
  role,
  nav,
  activeId,
  onNavChange,
  user,
  onLogout,
  onProfileClick,
  sidebarExtra,
  topbarRight,
  children,
}) => {
  const navigate = useNavigate();
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="dash">
      {/* ── Topbar ─────────────────────────────────────────────── */}
      <header className="dash-topbar">
        <a className="dash-topbar-logo" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <LogoIcon />
          Ticketing<em>Genie</em>
        </a>
        <div className="dash-topbar-divider" />
        <span className="dash-topbar-title">{title}</span>

        <div className="dash-topbar-right">
          {topbarRight}

          <span className={`dash-role-badge ${ROLE_BADGE_CLASS[role]}`}>
            {ROLE_LABEL[role]}
          </span>

          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
            {user?.email}
          </span>

          {onProfileClick ? (
            <button
              className="dash-avatar dash-avatar--btn"
              title="View profile"
              onClick={onProfileClick}
            >
              {initials}
            </button>
          ) : (
            <span className="dash-avatar">{initials}</span>
          )}

          <button className="dash-logout-btn" onClick={onLogout}>
            <LogoutIcon /> Sign out
          </button>
        </div>
      </header>

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <span className="dash-nav-label">Menu</span>
        {nav.map((item) => (
          <button
            key={item.id}
            className={`dash-nav-item${activeId === item.id ? ' dash-nav-item--active' : ''}`}
            onClick={() => onNavChange(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {sidebarExtra}
      </aside>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
