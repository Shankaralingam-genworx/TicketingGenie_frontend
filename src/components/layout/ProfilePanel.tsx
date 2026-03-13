/**
 * components/layout/ProfilePanel.tsx
 *
 * Slide-in profile panel reused by Admin, Agent, TeamLead, and Customer dashboards.
 * Replaces AdminProfileModal (and equivalent per-role modals) with one shared component.
 *
 * Usage:
 *   <ProfilePanel
 *     user={user}
 *     onClose={...}
 *     onChangePassword={...}
 *     permissions={['Full access', 'Manage users']}  // optional
 *   />
 */

import React, { useEffect } from 'react';
import { CloseIcon } from '@/components/icons';
import type { UserRole } from '@/types';

interface ProfileUser {
  id?: string | number;
  name?: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
}

interface Permission {
  emoji: string;
  label: string;
}

interface Props {
  user: ProfileUser | null;
  onClose: () => void;
  onChangePassword?: () => void;
  permissions?: Permission[];
  extraActions?: React.ReactNode;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin:         'Administrator',
  team_lead:     'Team Lead',
  support_agent: 'Support Agent',
  customer:      'Customer',
};

const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { emoji: '🛡️', label: 'Full system access' },
    { emoji: '👥', label: 'Manage users' },
    { emoji: '⚙️', label: 'Configure SLA & issues' },
    { emoji: '📊', label: 'View analytics' },
  ],
  team_lead: [
    { emoji: '🎫', label: 'Manage team tickets' },
    { emoji: '👁️', label: 'View agent workload' },
    { emoji: '📋', label: 'Assign tickets' },
  ],
  support_agent: [
    { emoji: '🎫', label: 'Handle assigned tickets' },
    { emoji: '💬', label: 'Post comments' },
    { emoji: '✅', label: 'Resolve tickets' },
  ],
  customer: [
    { emoji: '🎫', label: 'Create tickets' },
    { emoji: '💬', label: 'Add comments' },
    { emoji: '📬', label: 'Receive notifications' },
  ],
};

const ProfilePanel: React.FC<Props> = ({
  user,
  onClose,
  onChangePassword,
  permissions,
  extraActions,
}) => {
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const perms = permissions ?? (user ? DEFAULT_PERMISSIONS[user.role] : []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="profile-overlay profile-overlay--in" onClick={onClose} />
      <div className="profile-panel profile-panel--in">
        <button className="profile-close-btn" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-lg">{initials}</div>
          </div>
          <div className="profile-hero-info">
            <p className="profile-display-name">{user?.name ?? user?.email ?? 'Unknown'}</p>
            <span className="profile-role-badge">
              <span className="profile-role-dot" />
              {user ? ROLE_LABEL[user.role] : '—'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="profile-section">
          <p className="profile-section-label">Account details</p>
          <div className="profile-detail-grid">
            {user?.id && (
              <div className="profile-detail-row">
                <span className="profile-detail-key">ID</span>
                <span className="profile-detail-val">#{user.id}</span>
              </div>
            )}
            <div className="profile-detail-row">
              <span className="profile-detail-key">Email</span>
              <span className="profile-detail-val">{user?.email ?? '—'}</span>
            </div>
            {user?.phone && (
              <div className="profile-detail-row">
                <span className="profile-detail-key">Phone</span>
                <span className="profile-detail-val">{user.phone}</span>
              </div>
            )}
            {user?.department && (
              <div className="profile-detail-row">
                <span className="profile-detail-key">Dept.</span>
                <span className="profile-detail-val">{user.department}</span>
              </div>
            )}
            <div className="profile-detail-row">
              <span className="profile-detail-key">Role</span>
              <span className="profile-detail-val profile-detail-val--full">
                {user ? ROLE_LABEL[user.role] : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Permissions */}
        {perms.length > 0 && (
          <div className="profile-section">
            <p className="profile-section-label">Permissions</p>
            <div className="profile-perms-grid">
              {perms.map((p) => (
                <div key={p.label} className="profile-perm-chip">
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="profile-section profile-actions">
          <p className="profile-section-label">Actions</p>

          {onChangePassword && (
            <button
              className="profile-action-btn"
              onClick={onChangePassword}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              Change password
            </button>
          )}

          {extraActions}
        </div>
      </div>
    </>
  );
};

export default ProfilePanel;
