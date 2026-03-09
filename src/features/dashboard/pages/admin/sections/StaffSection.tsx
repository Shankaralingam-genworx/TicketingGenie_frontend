import React, { useState } from 'react';
import { StaffMember } from '../types';
import { ApiClient } from '../hooks/useApi';
import { STAFF_ROLES, ROLE_LABEL } from '../constants';
import {
  Spinner,
  ActivePill,
  ConfirmDlg,
  Modal,
  Field,
  Input,
  Select,
} from '../components/Shared';
import {
  StaffIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
} from '../components/Icons';

/* ── Role badge ─────────────────────────────────────────────────────────── */
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const isLead  = role === 'team_lead';
  return (
    <span style={{
      display:       'inline-block',
      fontSize:      '0.7rem',
      fontWeight:    700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      padding:       '2px 9px',
      borderRadius:  100,
      background:    isLead ? '#FFF7ED' : '#EFF6FF',
      color:         isLead ? '#C2410C' : '#1D4ED8',
      border:        `1px solid ${isLead ? '#FED7AA' : '#BFDBFE'}`,
    }}>
      {ROLE_LABEL[role] ?? role}
    </span>
  );
};

/* ── Team chip ──────────────────────────────────────────────────────────── */
const TeamChip: React.FC<{ name: string | null }> = ({ name }) =>
  name ? (
    <span style={{
      fontSize: '0.78rem', fontWeight: 500,
      color: 'var(--slate-700)',
      background: 'var(--slate-100)',
      border: '1px solid var(--slate-200)',
      padding: '2px 8px', borderRadius: 6,
    }}>
      {name}
    </span>
  ) : (
    <span style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>Unassigned</span>
  );

/* ── Create Staff form ──────────────────────────────────────────────────── */
const StaffForm: React.FC<{
  onSave:  (d: { name: string; email: string; role: string }) => void;
  onClose: () => void;
  saving:  boolean;
}> = ({ onSave, onClose, saving }) => {
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState<string>('support_agent');

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = name.trim().length > 0 && emailRx.test(email);

  return (
    <div className="adm-form">
      <Field label="Full name" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          autoFocus
        />
      </Field>

      <Field label="Email address" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@company.com"
        />
        <span className="adm-hint">
          A welcome email with login credentials will be sent automatically.
        </span>
      </Field>

      <Field label="Role" required>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </Select>
        <span className="adm-hint">
          {role === 'TEAM_LEAD'
            ? 'Team Leads can manage queues and assign tickets within their team.'
            : 'Support Agents handle tickets assigned to them.'}
        </span>
      </Field>

      <div className="adm-form-actions">
        <button className="btn btn--outline" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          className="btn btn--primary"
          disabled={!valid || saving}
          onClick={() => onSave({ name: name.trim(), email: email.trim(), role })}
        >
          {saving ? <><Spinner size={14} color="white" /> Creating…</> : 'Create staff'}
        </button>
      </div>
    </div>
  );
};

/* ── Staff detail modal ─────────────────────────────────────────────────── */
const StaffDetail: React.FC<{ staff: StaffMember; onClose: () => void }> = ({ staff, onClose }) => (
  <div className="adm-form">
    <div className="adm-detail-grid">
      {([
        ['ID',         `#${staff.id}`],
        ['Name',       staff.name],
        ['Email',      staff.email],
        ['Role',       <RoleBadge role={staff.role} />],
        ['Team',       <TeamChip name={staff.team_name} />],
        ['Status',     <ActivePill on={staff.is_active} />],
        ['Created',    new Date(staff.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
      ] as [string, React.ReactNode][]).map(([label, val]) => (
        <div key={label} className="adm-detail-row">
          <span className="adm-detail-label">{label}</span>
          <span className="adm-detail-val">{val}</span>
        </div>
      ))}
    </div>
    <div className="adm-form-actions">
      <button className="btn btn--outline" onClick={onClose}>Close</button>
    </div>
  </div>
);

/* ── StaffSection ───────────────────────────────────────────────────────── */
interface Props {
  staff:     StaffMember[];
  loading:   boolean;
  onRefresh: () => void;
  api:       ApiClient;
  onToast:   (msg: string, ok?: boolean) => void;
}

const StaffSection: React.FC<Props> = ({ staff, loading, onRefresh, api, onToast }) => {
  const [modal,   setModal]   = useState<'create' | 'detail' | null>(null);
  const [target,  setTarget]  = useState<StaffMember | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const openCreate = () => { setTarget(null); setModal('create'); };
  const openDetail = (s: StaffMember) => { setTarget(s); setModal('detail'); };
  const closeModal = () => { setModal(null); setTarget(null); };

  const handleCreate = async (data: { name: string; email: string; role: string }) => {
    setSaving(true);
    try {
      await api.post('/admin/staff', data, 'auth');
      onToast(`${ROLE_LABEL[data.role]} "${data.name}" created — credentials emailed.`);
      closeModal();
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  // Filter logic
  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const agents = staff.filter((s) => s.role === 'support_agent');
  const leads  = staff.filter((s) => s.role === 'team_lead');

  return (
    <>
      {/* Header */}
      <div className="adm-section-hdr">
        <div>
          <h1 className="dash-page-title">Staff Management</h1>
          <p className="dash-page-sub">
            Create and manage support agents and team leads.
          </p>
        </div>
        <div className="adm-hdr-actions">
          <button className="btn btn--outline btn--sm" onClick={onRefresh} disabled={loading}>
            <RefreshIcon /> Refresh
          </button>
          <button className="btn btn--primary" onClick={openCreate}>
            <PlusIcon /> Add Staff
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <span className="adm-stat-label">Total Staff</span>
          <span className="adm-stat-value">{staff.length}</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Support Agents</span>
          <span className="adm-stat-value adm-stat-value--blue">{agents.length}</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Team Leads</span>
          <span className="adm-stat-value adm-stat-value--amber">{leads.length}</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Unassigned</span>
          <span className="adm-stat-value adm-stat-value--slate">
            {staff.filter((s) => !s.team_id).length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="adm-filter-bar">
        <div className="adm-search-wrap">
          <SearchIcon />
          <input
            className="adm-search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="adm-filter-tabs">
          {(['all', 'support_agent', 'team_lead'] as const).map((r) => (
            <button
              key={r}
              className={`adm-tab${roleFilter === r ? ' adm-tab--on' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'All roles' : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div>
            <h3>Staff members</h3>
            <p>
              {loading ? 'Loading…' : `${filtered.length} of ${staff.length} shown`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading"><Spinner size={22} /><span>Loading staff…</span></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <StaffIcon />
            <p>{search || roleFilter !== 'all' ? 'No staff match your filters.' : 'No staff yet.'}</p>
            <span>
              {search || roleFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Click "Add Staff" to create the first support agent or team lead.'}
            </span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td><span className="adm-id">#{s.id}</span></td>
                  <td>
                    <div className="adm-staff-cell">
                      <div className="adm-staff-avatar">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="adm-name" style={{ fontWeight: 500 }}>{s.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>{s.email}</span>
                  </td>
                  <td><RoleBadge role={s.role} /></td>
                  <td><TeamChip name={s.team_name} /></td>
                  <td><ActivePill on={s.is_active} /></td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    <div className="adm-row-actions">
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => openDetail(s)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <Modal
          title="Add new staff member"
          sub="Creates an account and emails login credentials automatically."
          onClose={closeModal}
        >
          <StaffForm onSave={handleCreate} onClose={closeModal} saving={saving} />
        </Modal>
      )}

      {modal === 'detail' && target && (
        <Modal
          title={target.name}
          sub={`${ROLE_LABEL[target.role]} · ${target.email}`}
          onClose={closeModal}
        >
          <StaffDetail staff={target} onClose={closeModal} />
        </Modal>
      )}
    </>
  );
};

export default StaffSection;
