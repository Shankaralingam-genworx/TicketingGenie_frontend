import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useAppDispatch';
import { logout } from '../../../auth';

import { Issue, IssueResolver, SLA, ToastDef, StaffMember, TeamDetail } from './types';
import { NAV } from './constants';
import { useApi } from './hooks/useApi';
import { Spinner, ToastBar } from './components/Shared';
import {
  LogoIcon,
  GridIcon,
  IssueIcon,
  SLAIcon,
  MapIcon,
  LogoutIcon,
  StaffIcon,
  TeamIcon,
} from './components/Icons';

import OverviewSection  from './sections/OverviewSection';
import IssuesSection    from './sections/IssuesSection';
import SLASection       from './sections/SLASection';
import ResolversSection from './sections/ResolversSection';
import StaffSection     from './sections/StaffSection';
import TeamsSection     from './sections/TeamsSection';

import './DashBoard.css';
import './AdminDashboard.css';
import { logoutThunk } from '../../../auth/slices/authSlice';

/* ── icon map ────────────────────────────────────────────────────────────── */
const NAV_ICONS: Record<string, React.ReactNode> = {
  overview:  <GridIcon />,
  issues:    <IssueIcon />,
  sla:       <SLAIcon />,
  resolvers: <MapIcon />,
  staff:     <StaffIcon />,
  teams:     <TeamIcon />,
};

type ActiveSection = 'overview' | 'issues' | 'sla' | 'resolvers' | 'staff' | 'teams';

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

  const [toasts, setToasts] = useState<ToastDef[]>([]);

  const addToast = useCallback(
    (msg: string, ok = true) =>
      setToasts((ts) => [...ts, { id: Date.now() + Math.random(), msg, ok }]),
    [],
  );
  const removeToast = (id: number) =>
    setToasts((ts) => ts.filter((t) => t.id !== id));

  const api     = useApi(token);
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'AD';

  /* ── loaders ─────────────────────────────────────────────────────────── */
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

  return (
    <>
      <div className="dash">
        <header className="dash-topbar">
          <a className="dash-topbar-logo" href="/">
            <LogoIcon />
            Ticketing<em>Genie</em>
          </a>
          <div className="dash-topbar-divider" />
          <span className="dash-topbar-title">Admin Control Panel</span>
          <div className="dash-topbar-right">
            <span className="dash-role-badge dash-role-badge--admin">Admin</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{user?.email}</span>
            <div className="dash-avatar" title={user?.email ?? ''}>{initials}</div>
            <button className="dash-logout-btn" onClick={handleLogout}>
              <LogoutIcon /> Sign out
            </button>
          </div>
        </header>

        <aside className="dash-sidebar">
          <span className="dash-nav-label">Menu</span>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`dash-nav-item${active === n.id ? ' dash-nav-item--active' : ''}`}
              onClick={() => setActive(n.id as ActiveSection)}
            >
              {NAV_ICONS[n.id]}
              {n.label}
            </button>
          ))}

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
        </aside>

        <main className="dash-main">
          {active === 'overview' && (
            <OverviewSection issues={issues} slas={slas} resolvers={resolvers} />
          )}
          {active === 'issues' && (
            <IssuesSection issues={issues} loading={loadingI} onRefresh={loadIssues} api={api} onToast={addToast} />
          )}
          {active === 'sla' && (
            <SLASection slas={slas} loading={loadingS} onRefresh={loadSLAs} api={api} onToast={addToast} />
          )}
          {active === 'resolvers' && (
            <ResolversSection
              resolvers={resolvers} issues={issues} loading={loadingR}
              onRefresh={() => { loadResolvers(); loadIssues(); }}
              api={api} onToast={addToast}
            />
          )}
          {active === 'staff' && (
            <StaffSection
              staff={staff} loading={loadingSt}
              onRefresh={() => { loadStaff(); loadTeams(); }}
              api={api} onToast={addToast}
            />
          )}
          {active === 'teams' && (
            <TeamsSection
              teams={teams} staff={staff} loading={loadingTm}
              onRefresh={() => { loadTeams(); loadStaff(); }}
              api={api} onToast={addToast}
            />
          )}
        </main>
      </div>

      <div className="adm-toasts">
        {toasts.map((t) => (
          <ToastBar key={t.id} t={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </>
  );
};

export default AdminDashboard;
