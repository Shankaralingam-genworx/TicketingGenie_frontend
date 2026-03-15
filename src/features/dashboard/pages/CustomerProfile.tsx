import React from 'react';
import ProfilePage from '../components/ProfilePage';
import { useMyTickets } from '@/features/tickets/hooks/useTickets';
import { TicketStatus } from '@/features/tickets/types/ticket.types';
import { useAppSelector } from '@/hooks/useAppDispatch';

export default function CustomerProfile() {
  const { tickets } = useMyTickets();
  const user = useAppSelector((s) => s.auth.user);

  const open     = tickets.filter((t) => [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.REOPENED].includes(t.status as TicketStatus)).length;
  const resolved = tickets.filter((t) => [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status as TicketStatus)).length;

  const tier = (user as any)?.customer_tier ?? 'standard';

  return (
    <ProfilePage
      statsTitle="Support Summary"
      stats={[
        { label: 'Total Tickets', value: tickets.length, color: '#2563EB' },
        { label: 'Open / Active',  value: open,           color: '#EF4444' },
        { label: 'Resolved',       value: resolved,        color: '#22C55E' },
      ]}
      extraDetails={[
        { label: 'Tier', value: tier.charAt(0).toUpperCase() + tier.slice(1) },
      ]}
    />
  );
}
