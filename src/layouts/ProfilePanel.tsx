/**
 * ProfilePanel — shared slide-in profile panel for all roles.
 * Used when clicking the avatar in the topbar (Admin/Agent/Lead).
 * For the full profile page, see features/dashboard/components/ProfilePage.tsx
 */
import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import type { UserRole } from '@/types';

interface ProfileUser {
  id?:    string | number;
  name?:  string;
  email:  string;
  role:   UserRole;
}

interface Props {
  user:              ProfileUser | null;
  onClose:           () => void;
  onChangePassword?: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin:         'Administrator',
  team_lead:     'Team Lead',
  support_agent: 'Support Agent',
  customer:      'Customer',
};

const ROLE_COLOR: Record<UserRole, string> = {
  admin:         '#7C3AED',
  team_lead:     '#6D28D9',
  support_agent: '#059669',
  customer:      '#1D4ED8',
};

const ProfilePanel: React.FC<Props> = ({ user, onClose, onChangePassword }) => {
  const panelRef            = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const initials   = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';
  const roleLabel  = user?.role ? ROLE_LABEL[user.role] : '';
  const roleColor  = user?.role ? ROLE_COLOR[user.role] : '#2563EB';
  const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={`profile-overlay ${visible ? 'profile-overlay--in' : ''}`}>
      <div ref={panelRef} className={`profile-panel ${visible ? 'profile-panel--in' : ''}`}>
        <button className="profile-close-btn" onClick={handleClose}>
          <CloseIcon />
        </button>

        {/* Avatar hero */}
        <div className="profile-hero">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-lg" style={{ background: `linear-gradient(135deg, ${roleColor}99, ${roleColor})` }}>
              {initials}
            </div>
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-display-name">
              {user?.name ?? user?.email?.split('@')[0] ?? 'User'}
            </h2>
            <div className="profile-role-badge">
              <span className="profile-role-dot" style={{ background: roleColor }} />
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="profile-section">
          <div className="profile-section-label">Account details</div>
          <div className="profile-detail-grid">
            <div className="profile-detail-row">
              <span className="profile-detail-key">Email</span>
              <span className="profile-detail-val">{user?.email ?? '—'}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-key">Role</span>
              <span className="profile-detail-val">{roleLabel}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-key">Member since</span>
              <span className="profile-detail-val">{joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {onChangePassword && (
          <div className="profile-section profile-actions">
            <button
              className="profile-action-btn"
              onClick={() => { handleClose(); setTimeout(onChangePassword, 240); }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="8" width="14" height="10" rx="2" />
                <path d="M7 8V5a3 3 0 016 0v3" />
                <circle cx="10" cy="13" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              Change password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;
