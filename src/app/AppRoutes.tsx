/**
 * AppRoutes.tsx
 * Changes from previous version (team lead section only):
 *   - LeadSlaDashboard import + route REMOVED
 *   - AgentWorkload import + route ADDED at /lead/agents
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GuestGuard, AuthGuard } from './routes';

// Public pages
import LandingPage from '../pages/LandingPage';
import LoginPage   from '../pages/LoginPage';

// Dashboard layouts
import AdminDashboard    from '../features/dashboard/pages/admin/AdminDashboard';
import CustomerDashboard from '../features/dashboard/pages/CustomerDashboard';
import AgentDashboard    from '../features/dashboard/pages/AgentDashboard';
import LeadDashboard     from '../features/dashboard/pages/LeadDashboard';

// Customer pages
import MyTickets      from '../features/tickets/pages/customer/MyTickets';
import CreateTicket   from '../features/tickets/pages/customer/CreateTicket';
import TicketDetails  from '../features/tickets/pages/customer/TicketDetails';
import CustomerProfile from '../features/dashboard/pages/CustomerProfile';

// Agent pages
import AssignedTickets from '../features/tickets/pages/agent/AssignedTickets';
import TicketWorkView  from '../features/tickets/pages/agent/TicketWorkView';
import AgentProfile    from '../features/dashboard/pages/AgentProfile';

// Team Lead pages
import LeadQueue        from '../features/tickets/pages/teamLead/LeadQueue';
import TeamTickets      from '../features/tickets/pages/teamLead/TeamTickets';
import LeadTicketDetail from '../features/tickets/pages/teamLead/LeadTicketDetail';
import AgentWorkload    from '../features/tickets/pages/teamLead/AgentWorkload';   // NEW
import LeadProfile      from '../features/dashboard/pages/LeadProfile';

const AppRoutes: React.FC = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/"  element={<LandingPage />} />

      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<AuthGuard allowedRoles={['admin']} />}>
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>

      <Route element={<AuthGuard allowedRoles={['customer']} />}>
        <Route path="/customer" element={<CustomerDashboard />}>
          <Route index element={<Navigate to="tickets" replace />} />
          <Route path="tickets"     element={<MyTickets />} />
          <Route path="tickets/:id" element={<TicketDetails />} />
          <Route path="new-ticket"  element={<CreateTicket />} />
          <Route path="profile"     element={<CustomerProfile />} />
        </Route>
      </Route>

      <Route element={<AuthGuard allowedRoles={['support_agent']} />}>
        <Route path="/agent" element={<AgentDashboard />}>
          <Route index element={<Navigate to="tickets" replace />} />
          <Route path="tickets"     element={<AssignedTickets />} />
          <Route path="tickets/:id" element={<TicketWorkView />} />
          <Route path="profile"     element={<AgentProfile />} />
        </Route>
      </Route>

      <Route element={<AuthGuard allowedRoles={['team_lead']} />}>
        <Route path="/lead" element={<LeadDashboard />}>
          <Route index element={<Navigate to="queue" replace />} />
          <Route path="queue"       element={<LeadQueue />} />
          <Route path="tickets"     element={<TeamTickets />} />
          <Route path="tickets/:id" element={<LeadTicketDetail />} />
          <Route path="agents"      element={<AgentWorkload />} />  {/* NEW — replaces sla */}
          <Route path="profile"     element={<LeadProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;