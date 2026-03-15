/**
 * AdminDashboard.tsx — Admin Control Panel
 * Refactored to use:
 *   - DashboardLayout (shared shell)
 *   - ProfilePanel (shared profile slide panel)
 *   - useToasts (shared toast hook)
 *   - centralized icons from @/components/icons
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { logoutThunk } from '@/features/auth/slices/authSlice';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';

import type { Issue, IssueResolver, SLA, StaffMember, TeamDetail } from './types';
import { NAV } from './constants';
import { useApi } from './hooks/useApi';
import { Spinner } from '@/components/ui';
import { ToastStack, useToasts } from '@/components/ui/Toast';
import DashboardLayout, { type NavItem } from '@/layouts/DashboardLayout';

import {
  GridIcon, IssueIcon, SLAIcon, MapIcon, StaffIcon, TeamIcon, EmailIcon,
} from '@/components/icons';

import DashboardSection  from './sections/DashboardSection';
import IssuesSection     from './sections/IssuesSection';
import SLASection        from './sections/SLASection';
import ResolversSection  from './sections/ResolversSection';
import StaffSection      from './sections/StaffSection';
import TeamsSection      from './sections/TeamsSection';
import EmailConfigSection from './sections/EmailConfigSection';
import NotificationBell  from '@/features/notifications/components/NotificationBell';
import AdminProfile      from '@/features/dashboard/pages/AdminProfile';

import './DashBoard.css';
import './AdminDashboard.css';

type ActiveSection = 'overview' | 'issues' | 'sla' | 'resolvers' | 'staff' | 'teams' | 'email' | 'profile';

const ACCENT = '#7C3AED';

const NAV_ICONS: Record<string, React.ReactNode> = {
  overview:  <GridIcon />,
  issues:    <IssueIcon />,
  sla:       <SLAIcon />,
  resolvers: <MapIcon />,
  staff:     <StaffIcon />,
  teams:     <TeamIcon />,
  email:     <EmailIcon />,
};

const NAV_ITEMS: NavItem[] = NAV.map((n) => ({
  id: n.id,
  label: n.label,
  icon: NAV_ICONS[n.id],
}));

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user  = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);

  const [active, setActive] = useState<ActiveSection>('overview');

  const [issues,    setIssues]    = useState<Issue[]>([]);
  const [slas,      setSLAs]      = useState<SLA[]>([]);
  const [resolvers, setResolvers] = useState<IssueResolver[]>([]);
  const [staff,     setStaff]     = useState<StaffMember[]>([]);
  const [teams,     setTeams]     = useState<TeamDetail[]>([]);

  const [loadingI,  setLoadingI]  = useState(false);
  const [loadingS,  setLoadingS]  = useState(false);
  const [loadingR,  setLoadingR]  = useState(false);
  const [loadingSt, setLoadingSt] = useState(false);
  const [loadingTm, setLoadingTm] = useState(false);

  const { toasts, addToast, removeToast } = useToasts();
  useSessionExpiry(addToast);

  const api = useApi(token);

  const loadIssues = useCallback(async () => {
    setLoadingI(true);
    try { setIssues(await api.get('/issues/')); }
    catch (e: any) { addToast(e.message, false); }
    finally { setLoadingI(false); }
  }, [api, addToast]);

  const loadSLAs = useCallback(async () => {
    setLoadingS(true);
    try { setSLAs(await api.get('/sla/')); }
    catch (e: any) { addToast(e.message, false); }
    finally { setLoadingS(false); }
  }, [api, addToast]);

  const loadResolvers = useCallback(async () => {
    setLoadingR(true);
    try { setResolvers(await api.get('/issue-resolvers/')); }
    catch (e: any) { addToast(e.message, false); }
    finally { setLoadingR(false); }
  }, [api, addToast]);

  const loadStaff = useCallback(async () => {
    setLoadingSt(true);
    try { setStaff(await api.get('/admin/staff', 'auth')); }
    catch (e: any) { addToast(e.message, false); }
    finally { setLoadingSt(false); }
  }, [api, addToast]);

  const loadTeams = useCallback(async () => {
    setLoadingTm(true);
    try { setTeams(await api.get('/admin/teams', 'auth')); }
    catch (e: any) { addToast(e.message, false); }
    finally { setLoadingTm(false); }
  }, [api, addToast]);

  useEffect(() => {
    loadIssues();
    loadSLAs();
    loadResolvers();
    loadStaff();
    loadTeams();
  }, [loadIssues, loadSLAs, loadResolvers, loadStaff, loadTeams]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  const sidebarExtra = (
    <div className="adm-sidebar-counts">
      <span className="dash-nav-label" style={{ paddingTop: 0 }}>Live counts</span>
      {[
        { label: 'Issues',   value: issues.length,    loading: loadingI  },
        { label: 'SLAs',     value: slas.length,      loading: loadingS  },
        { label: 'Mappings', value: resolvers.length, loading: loadingR  },
        { label: 'Staff',    value: staff.length,     loading: loadingSt },
        { label: 'Teams',    value: teams.length,     loading: loadingTm },
      ].map((c) => (
        <div key={c.label} className="adm-count-row">
          <span>{c.label}</span>
          {c.loading ? <Spinner size={12} /> : <strong>{c.value}</strong>}
        </div>
      ))}
    </div>
  );

  const topbarRight = (
    <NotificationBell token={token} accentColor={ACCENT} onNavigate={() => {}} />
  );

  return (
    <>
      <DashboardLayout
        title="Admin Control Panel"
        role="admin"
        nav={NAV_ITEMS}
        activeId={active}
        onNavChange={(id) => setActive(id as ActiveSection)}
        user={user}
        token={token}
        onLogout={handleLogout}
        onProfileClick={() => setActive('profile')}
        sidebarExtra={sidebarExtra}
        topbarRight={topbarRight}
      >
        {active === 'overview'  && <DashboardSection api={api} onToast={addToast} />}
        {active === 'issues'    && <IssuesSection issues={issues} loading={loadingI} onRefresh={loadIssues} api={api} onToast={addToast} />}
        {active === 'sla'       && <SLASection slas={slas} loading={loadingS} onRefresh={loadSLAs} api={api} onToast={addToast} />}
        {active === 'resolvers' && <ResolversSection resolvers={resolvers} issues={issues} loading={loadingR} onRefresh={() => { loadResolvers(); loadIssues(); }} api={api} onToast={addToast} />}
        {active === 'staff'     && <StaffSection staff={staff} loading={loadingSt} onRefresh={() => { loadStaff(); loadTeams(); }} api={api} onToast={addToast} />}
        {active === 'teams'     && <TeamsSection teams={teams} staff={staff} loading={loadingTm} onRefresh={() => { loadTeams(); loadStaff(); }} api={api} onToast={addToast} />}
        {active === 'email'     && <EmailConfigSection api={api} onToast={addToast} />}
        {active === 'profile'   && <AdminProfile />}
      </DashboardLayout>

      <ToastStack toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default AdminDashboard;