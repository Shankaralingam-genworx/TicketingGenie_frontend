/**
 * components/ui/Toast.tsx
 * Shared toast notification system used by all dashboard roles.
 *
 * Usage:
 *   const { toasts, addToast, removeToast } = useToasts();
 *   addToast('Saved!');
 *   addToast('Something went wrong', false);  // error toast
 *   <ToastStack toasts={toasts} onRemove={removeToast} />
 */

import React, { useCallback, useEffect, useState } from 'react';
import { CheckIcon, AlertTriIcon } from '@/components/icons';

export interface ToastItem {
  id: number;
  msg: string;
  ok: boolean;
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((msg: string, ok = true) => {
    setToasts((ts) => [...ts, { id: Date.now() + Math.random(), msg, ok }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// ── Single Toast ────────────────────────────────────────────────────────────────

const Toast: React.FC<{ item: ToastItem; onDone: () => void }> = ({ item, onDone }) => {
  useEffect(() => {
    const h = setTimeout(onDone, 3200);
    return () => clearTimeout(h);
  }, [onDone]);

  return (
    <div className={`adm-toast${item.ok ? '' : ' adm-toast--err'}`}>
      {item.ok ? <CheckIcon /> : <AlertTriIcon />}
      {item.msg}
    </div>
  );
};

// ── Stack ────────────────────────────────────────────────────────────────────────

export const ToastStack: React.FC<{
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}> = ({ toasts, onRemove }) => (
  <div className="adm-toasts">
    {toasts.map((t) => (
      <Toast key={t.id} item={t} onDone={() => onRemove(t.id)} />
    ))}
  </div>
);

export default Toast;
