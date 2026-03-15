import React, { useEffect, useState } from 'react';
import ProfilePage from '../components/ProfilePage';
import { userService } from '@/features/users/services/userService';
import type { TicketResponse } from '@/features/tickets/types/ticket.types';

export default function AgentProfile() {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);

  useEffect(() => {
    userService.fetchAssignedTickets()
      .then(setTickets)
      .catch(() => setTickets([]));
  }, []);

  const active = tickets.filter((t) =>
    ['assigned','open','in_progress','on_hold'].includes(t.status)
  ).length;

  const resolved = tickets.filter((t) =>
    ['resolved','closed'].includes(t.status)
  ).length;

  return (
    <ProfilePage
      statsTitle="Workload Summary"
      stats={[
        { label: 'Total Assigned', value: tickets.length, color: '#2563EB' },
        { label: 'Active', value: active, color: '#D97706' },
        { label: 'Resolved', value: resolved, color: '#16A34A' },
      ]}
    />
  );
}
