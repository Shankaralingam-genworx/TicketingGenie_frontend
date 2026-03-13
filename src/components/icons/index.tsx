/**
 * components/icons/index.tsx
 * Single source of truth for all SVG icons used across the app.
 * Import from here instead of feature-local icon files.
 */

import React from 'react';

// ── App / Brand ────────────────────────────────────────────────────────────────

export const LogoIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
    <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
    <path d="M12 20H28M12 14H22M12 26H20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
  </svg>
);

// ── Navigation ─────────────────────────────────────────────────────────────────

export const GridIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="2" y="2" width="7" height="7" rx="1" />
    <rect x="11" y="2" width="7" height="7" rx="1" />
    <rect x="2" y="11" width="7" height="7" rx="1" />
    <rect x="11" y="11" width="7" height="7" rx="1" />
  </svg>
);

export const IssueIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3M13 3h4v4M13 7l4-4M7 9h6M7 12h4" />
  </svg>
);

export const SLAIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="10" cy="10" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6v4l3 3" />
  </svg>
);

export const MapIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

export const StaffIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" />
  </svg>
);

export const TeamIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20H3v-2a5 5 0 0110 0v2zM9 10a3 3 0 100-6 3 3 0 000 6zm8 4a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export const EmailIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width={16} height={16}>
    <rect x="2" y="4" width="16" height="12" rx="2" />
    <path d="M2 7l8 5 8-5" />
  </svg>
);

// ── Actions ─────────────────────────────────────────────────────────────────────

export const PlusIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" d="M7 2v10M2 7h10" />
  </svg>
);

export const EditIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
  </svg>
);

export const TrashIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 3.5h11M4.5 3.5V2h5v1.5M5.5 6v4.5M8.5 6v4.5M2.5 3.5l1 9h7l1-9" />
  </svg>
);

export const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" d="M2 2l10 10M12 2L2 12" />
  </svg>
);

export const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 7l4 4 7-7" />
  </svg>
);

export const SearchIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="9" cy="9" r="6" />
    <path strokeLinecap="round" d="M15 15l3 3" />
  </svg>
);

export const LogoutIcon: React.FC = () => (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16l4-6-4-6M17 10H7M3 4v12" />
  </svg>
);

export const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM5.46056 11.0833C5.83331 7.79988 8.62404 5.25 12.0096 5.25C14.148 5.25 16.0489 6.26793 17.2521 7.84246C17.5036 8.17158 17.4406 8.64227 17.1115 8.89376C16.7824 9.14526 16.3117 9.08233 16.0602 8.7532C15.1289 7.53445 13.6613 6.75 12.0096 6.75C9.45213 6.75 7.33639 8.63219 6.9733 11.0833H7.33652C7.63996 11.0833 7.9135 11.2662 8.02953 11.5466C8.14556 11.8269 8.0812 12.1496 7.86649 12.364L6.69823 13.5307C6.40542 13.8231 5.9311 13.8231 5.63829 13.5307L4.47003 12.364C4.25532 12.1496 4.19097 11.8269 4.30699 11.5466C4.42302 11.2662 4.69656 11.0833 5 11.0833H5.46056ZM18.3617 10.4693C18.0689 10.1769 17.5946 10.1769 17.3018 10.4693L16.1335 11.636C15.9188 11.8504 15.8545 12.1731 15.9705 12.4534C16.0865 12.7338 16.3601 12.9167 16.6635 12.9167H17.0267C16.6636 15.3678 14.5479 17.25 11.9905 17.25C10.3464 17.25 8.88484 16.4729 7.9529 15.2638C7.70002 14.9358 7.22908 14.8748 6.90101 15.1277C6.57295 15.3806 6.512 15.8515 6.76487 16.1796C7.96886 17.7416 9.86205 18.75 11.9905 18.75C15.376 18.75 18.1667 16.2001 18.5395 12.9167H19C19.3035 12.9167 19.577 12.7338 19.693 12.4534C19.8091 12.1731 19.7447 11.8504 19.53 11.636L18.3617 10.4693Z"
      fill="currentColor"
    />
  </svg>
);

export const BackIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10H5M9 6l-4 4 4 4" />
  </svg>
);

export const ArrowIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 7h10M8 3l4 4-4 4" />
  </svg>
);

// ── Status / Alerts ─────────────────────────────────────────────────────────────

export const AlertTriIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L2 17h16L10 3zm0 5v4M10 15h.01" />
  </svg>
);

export const ShieldIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 2L3 5v5c0 4.5 3 8 7 9 4-1 7-4.5 7-9V5l-7-3z" />
  </svg>
);

export const UsersIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20H3v-2a5 5 0 0110 0v2zM9 10a3 3 0 100-6 3 3 0 000 6zm8 4a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// ── Form ────────────────────────────────────────────────────────────────────────

export const EyeOpenIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} width={16} height={16}>
    <path d="M10 4C5 4 1.5 10 1.5 10S5 16 10 16s8.5-6 8.5-6S15 4 10 4z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

export const EyeClosedIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} width={16} height={16}>
    <path d="M3 3l14 14M10 4C5 4 1.5 10 1.5 10s.8 1.4 2.2 2.8M16.8 7.2c1 1.3 1.7 2.8 1.7 2.8S15 16 10 16c-1.4 0-2.7-.4-3.8-1" />
  </svg>
);

export const AttachIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 15, height: 15 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l-7 7a2.5 2.5 0 003.536 3.536l7.778-7.778a4.5 4.5 0 00-6.364-6.364L3.672 10.67a6.5 6.5 0 009.192 9.192L18 14.5" />
  </svg>
);
