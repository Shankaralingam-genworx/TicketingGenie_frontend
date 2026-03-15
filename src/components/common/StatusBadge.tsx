/**
 * components/common/StatusBadge.tsx
 * Re-exports badge primitives for use outside the tickets feature.
 * The source of truth is features/tickets/components/TicketBadges.tsx.
 */
export {
  StatusBadge,
  PriorityBadge,
  SlaChip,
  EscalatedBadge,
  SlaBreachBadge,
  TicketSlaBreachBadges,
} from '@/features/tickets/components/TicketBadges';
