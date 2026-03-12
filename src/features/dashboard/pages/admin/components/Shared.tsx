/**
 * @deprecated Import from '@/components/ui' directly.
 * Re-exports shared UI components for backward compatibility.
 */
export { Spinner, SevBadge, TierBadge, ActivePill, ConfirmDlg, Modal, Field, Input, Select, Textarea, Tabs } from '@/components/ui';

// ToastBar is renamed to Toast in the new system; provide alias:
export { ToastStack as ToastBar } from '@/components/ui/Toast';

// Re-export ToastDef type alias
export type { ToastItem as ToastDef } from '@/components/ui/Toast';
