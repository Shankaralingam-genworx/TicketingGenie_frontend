/**
 * AdminProfileModal.tsx
 * Slide-in profile panel — opened by clicking the avatar/initials in the topbar.
 * File: src/features/dashboard/pages/admin/components/AdminProfileModal.tsx
 */

import React, { useEffect, useRef, useState } from "react";

interface AdminUser {
  email: string;
  role?: string;
  name?: string;
}

interface Props {
  user: AdminUser | null;
  onClose: () => void;
  onChangePassword: () => void;
}

const AdminProfileModal: React.FC<Props> = ({
  user,
  onClose,
  onChangePassword,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AD";

  const joinedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`profile-overlay ${visible ? "profile-overlay--in" : ""}`}>
      <div
        ref={panelRef}
        className={`profile-panel ${visible ? "profile-panel--in" : ""}`}
      >
        {/* Close button */}
        <button className="profile-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>

        {/* Avatar hero */}
        <div className="profile-hero">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-lg">{initials}</div>
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-display-name">
              {user?.name ?? user?.email?.split("@")[0] ?? "Admin"}
            </h2>
            <div className="profile-role-badge">
              <span className="profile-role-dot" />
              Admin
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="profile-section">
          <div className="profile-section-label">Account details</div>
          <div className="profile-detail-grid">
            <div className="profile-detail-row">
              <span className="profile-detail-key">Email</span>
              <span className="profile-detail-val">{user?.email ?? "—"}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-key">Role</span>
              <span className="profile-detail-val">Administrator</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-key">Access level</span>
              <span className="profile-detail-val profile-detail-val--full">
                Full system access
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-key">Member since</span>
              <span className="profile-detail-val">{joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Permissions summary */}
        <div className="profile-section">
          <div className="profile-section-label">Permissions</div>
          <div className="profile-perms-grid">
            {[
              { icon: "⚙️", label: "System config" },
              { icon: "👥", label: "Staff management" },
              { icon: "📊", label: "Analytics" },
              { icon: "📧", label: "Email config" },
              { icon: "🔔", label: "Notifications" },
              { icon: "🛡️", label: "SLA policies" },
            ].map((p) => (
              <div key={p.label} className="profile-perm-chip">
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="profile-section profile-actions">
          <button
            className="profile-action-btn"
            onClick={() => {
              handleClose();
              setTimeout(onChangePassword, 240);
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="8" width="14" height="10" rx="2" />
              <path d="M7 8V5a3 3 0 016 0v3" />
              <circle cx="10" cy="13" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            Change password
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;