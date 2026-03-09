export const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  new:         { bg: '#EFF6FF', color: '#2563EB' },
  acknowledged:{ bg: '#E0F2FE', color: '#0284C7' },
  assigned:    { bg: '#F5F3FF', color: '#7C3AED' },
  open:        { bg: '#EFF6FF', color: '#2563EB' },
  in_progress: { bg: '#FFF7ED', color: '#D97706' },
  on_hold:     { bg: '#FAF5FF', color: '#7C3AED' },
  resolved:    { bg: '#F0FDF4', color: '#16A34A' },
  closed:      { bg: '#F8FAFC', color: '#64748B' },
  reopened:    { bg: '#FEF2F2', color: '#DC2626' },
};
