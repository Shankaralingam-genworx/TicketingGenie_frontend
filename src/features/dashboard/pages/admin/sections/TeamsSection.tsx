import React, { useState, useEffect } from 'react';
import { TeamDetail, TeamMemberInfo, StaffMember } from '../types';
import { ApiClient } from '../hooks/useApi';
import { ROLE_LABEL } from '../constants';
import {
  Spinner,
  ConfirmDlg,
  Modal,
  Field,
  Input,
  Select,
} from '../components/Shared';
import {
  TeamIcon,
  PlusIcon,
  RefreshIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  StaffIcon,
} from '../components/Icons';

/* ── Member badge ───────────────────────────────────────────────────────── */
const MemberPill: React.FC<{ member: TeamMemberInfo }> = ({ member }) => {
  const isLead = member.role === 'TEAM_LEAD';
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           5,
      fontSize:      '0.75rem',
      fontWeight:    500,
      padding:       '3px 9px',
      borderRadius:  100,
      background:    isLead ? '#FFF7ED' : '#EFF6FF',
      color:         isLead ? '#C2410C' : '#1D4ED8',
      border:        `1px solid ${isLead ? '#FED7AA' : '#BFDBFE'}`,
    }}>
      {isLead && <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>★</span>}
      {member.name}
    </span>
  );
};

/* ── Team card (detail view) ────────────────────────────────────────────── */
const TeamCard: React.FC<{
  team:     TeamDetail;
  onEdit:   (t: TeamDetail) => void;
  onDelete: (t: TeamDetail) => void;
}> = ({ team, onEdit, onDelete }) => (
  <div className="adm-team-card">
    <div className="adm-team-card-hdr">
      <div>
        <h3 className="adm-team-name">{team.name}</h3>
        <span className="adm-team-meta">
          {team.members.length} member{team.members.length !== 1 ? 's' : ''} ·{' '}
          Created {new Date(team.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      </div>
      <div className="adm-row-actions">
        <button className="btn btn--outline btn--sm" onClick={() => onEdit(team)}>
          <EditIcon /> Edit
        </button>
        <button className="btn btn--outline btn--sm adm-btn-del" onClick={() => onDelete(team)}>
          <TrashIcon />
        </button>
      </div>
    </div>

    {/* Team lead */}
    {team.team_lead && (
      <div className="adm-team-lead-row">
        <span className="adm-team-section-label">Team Lead</span>
        <div className="adm-staff-cell">
          <div className="adm-staff-avatar adm-staff-avatar--amber">
            {team.team_lead.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{team.team_lead.name}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              {team.team_lead.email}
            </span>
          </div>
        </div>
      </div>
    )}

    {/* Members */}
    <div className="adm-team-members">
      <span className="adm-team-section-label">
        Agents ({team.members.filter((m) => m.role !== 'TEAM_LEAD').length})
      </span>
      {team.members.filter((m) => m.role !== 'TEAM_LEAD').length === 0 ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>No agents assigned yet.</span>
      ) : (
        <div className="adm-member-pills">
          {team.members
            .filter((m) => m.role !== 'TEAM_LEAD')
            .map((m) => (
              <MemberPill key={m.user_id} member={m} />
            ))}
        </div>
      )}
    </div>
  </div>
);

/* ── Create / Edit Team form ────────────────────────────────────────────── */
const TeamForm: React.FC<{
  initial?: TeamDetail;
  allStaff: StaffMember[];
  onSave:   (d: any) => void;
  onClose:  () => void;
  saving:   boolean;
}> = ({ initial, allStaff, onSave, onClose, saving }) => {
  const isEdit = !!initial;

  const [name,      setName]      = useState(initial?.name ?? '');
  const [leadId,    setLeadId]    = useState<string>(
    initial?.team_lead_id ? String(initial.team_lead_id) : ''
  );
  const [agentIds,  setAgentIds]  = useState<Set<number>>(
    new Set(initial?.members.filter((m) => m.role !== 'TEAM_LEAD').map((m) => m.user_id) ?? [])
  );
  const [agentSearch, setAgentSearch] = useState('');

  // Eligible leads: unassigned TEAM_LEADs or the current lead
  const eligibleLeads = allStaff.filter(
    (s) => s.role === 'team_lead' && (!s.team_id || s.id === initial?.team_lead_id)
  );

  // Eligible agents: unassigned SUPPORT_AGENTs or already in this team
  const existingAgentIds = new Set(
    initial?.members.filter((m) => m.role !== 'TEAM_LEAD').map((m) => m.user_id) ?? []
  );
  const eligibleAgents = allStaff.filter(
    (s) => s.role === 'support_agent' && (!s.team_id || existingAgentIds.has(s.id))
  );

  const filteredAgents = eligibleAgents.filter((a) => {
    const q = agentSearch.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  const toggleAgent = (id: number) => {
    setAgentIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const valid = name.trim().length > 0 && leadId !== '';

  const handleSave = () => {
    if (!valid) return;
    if (isEdit && initial) {
      const prevAgentIds = new Set(
        initial.members.filter((m) => m.role !== 'team_lead').map((m) => m.user_id)
      );
      const add    = [...agentIds].filter((id) => !prevAgentIds.has(id));
      const remove = [...prevAgentIds].filter((id) => !agentIds.has(id));
      onSave({
        name:             name.trim() !== initial.name ? name.trim() : undefined,
        team_lead_id:     Number(leadId) !== initial.team_lead_id ? Number(leadId) : undefined,
        add_agent_ids:    add.length    ? add    : undefined,
        remove_agent_ids: remove.length ? remove : undefined,
      });
    } else {
      onSave({
        name:         name.trim(),
        team_lead_id: Number(leadId),
        agent_ids:    [...agentIds],
      });
    }
  };

  return (
    <div className="adm-form">
      <Field label="Team name" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tier-1 Support"
          autoFocus
        />
      </Field>

      <Field label="Team Lead" required>
        {eligibleLeads.length === 0 ? (
          <div className="adm-input adm-input-readonly" style={{ color: 'var(--slate-400)' }}>
            No available team leads — create one in Staff first.
          </div>
        ) : (
          <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">Select a team lead…</option>
            {eligibleLeads.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </Select>
        )}
        <span className="adm-hint">
          Only unassigned team leads are shown. A team lead can only belong to one team.
        </span>
      </Field>

      <Field label="Assign agents">
        <div className="adm-agent-picker">
          <div className="adm-agent-search">
            <SearchIcon />
            <input
              className="adm-search-input"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem' }}
              placeholder="Search agents…"
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
            />
          </div>
          <div className="adm-agent-list">
            {filteredAgents.length === 0 ? (
              <div style={{ padding: '12px 16px', color: 'var(--slate-400)', fontSize: '0.82rem' }}>
                {agentSearch ? 'No agents match your search.' : 'No available agents.'}
              </div>
            ) : (
              filteredAgents.map((a) => (
                <label key={a.id} className="adm-agent-row">
                  <input
                    type="checkbox"
                    checked={agentIds.has(a.id)}
                    onChange={() => toggleAgent(a.id)}
                  />
                  <div className="adm-staff-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{a.name}</span>
                    <span style={{ display: 'block', fontSize: '0.73rem', color: 'var(--slate-400)' }}>{a.email}</span>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="adm-agent-footer">
            {agentIds.size} agent{agentIds.size !== 1 ? 's' : ''} selected
          </div>
        </div>
        <span className="adm-hint">
          Only unassigned support agents are shown. Each agent belongs to at most one team.
        </span>
      </Field>

      <div className="adm-form-actions">
        <button className="btn btn--outline" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          className="btn btn--primary"
          disabled={!valid || saving}
          onClick={handleSave}
        >
          {saving
            ? <><Spinner size={14} color="white" /> Saving…</>
            : isEdit ? 'Save changes' : 'Create team'}
        </button>
      </div>
    </div>
  );
};

/* ── TeamsSection ───────────────────────────────────────────────────────── */
interface Props {
  teams:     TeamDetail[];
  staff:     StaffMember[];
  loading:   boolean;
  onRefresh: () => void;
  api:       ApiClient;
  onToast:   (msg: string, ok?: boolean) => void;
}

const TeamsSection: React.FC<Props> = ({ teams, staff, loading, onRefresh, api, onToast }) => {
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null);
  const [target,  setTarget]  = useState<TeamDetail | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState<TeamDetail | null>(null);
  const [search,  setSearch]  = useState('');

  const openCreate = () => { setTarget(null); setModal('create'); };
  const openEdit   = (t: TeamDetail) => { setTarget(t); setModal('edit'); };
  const closeModal = () => { setModal(null); setTarget(null); };

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      if (modal === 'edit' && target) {
        await api.put(`/admin/teams/${target.id}`, data, 'auth');
        onToast('Team updated.');
      } else {
        await api.post('/admin/teams', data, 'auth');
        onToast('Team created.');
      }
      closeModal();
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: TeamDetail) => {
    try {
      await api.delete(`/admin/teams/${t.id}`, 'auth');
      onToast(`Team "${t.name}" deleted.`);
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    }
    setConfirm(null);
  };

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.team_lead?.name.toLowerCase().includes(q) ||
      t.members.some((m) => m.name.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Header */}
      <div className="adm-section-hdr">
        <div>
          <h1 className="dash-page-title">Team Management</h1>
          <p className="dash-page-sub">
            Organise support agents under team leads. Each person belongs to at most one team.
          </p>
        </div>
        <div className="adm-hdr-actions">
          <button className="btn btn--outline btn--sm" onClick={onRefresh} disabled={loading}>
             <RefreshIcon style={{ width: "24px", height: "24px" }} /> Refresh
          </button>
          <button className="btn btn--primary" onClick={openCreate}>
            <PlusIcon /> New Team
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <span className="adm-stat-label">Total Teams</span>
          <span className="adm-stat-value">{teams.length}</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Total Agents</span>
          <span className="adm-stat-value adm-stat-value--blue">
            {teams.reduce((n, t) => n + t.members.filter((m) => m.role !== 'TEAM_LEAD').length, 0)}
          </span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-label">Avg. Team Size</span>
          <span className="adm-stat-value adm-stat-value--slate">
            {teams.length
              ? (teams.reduce((n, t) => n + t.members.length, 0) / teams.length).toFixed(1)
              : '—'}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="adm-filter-bar">
        <div className="adm-search-wrap">
          <SearchIcon />
          <input
            className="adm-search-input"
            placeholder="Search by team name, lead or member…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="adm-loading"><Spinner size={22} /><span>Loading teams…</span></div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">
          <TeamIcon />
          <p>{search ? 'No teams match your search.' : 'No teams yet.'}</p>
          <span>
            {search
              ? 'Try a different search term.'
              : 'Click "New Team" to create the first team and assign a team lead.'}
          </span>
        </div>
      ) : (
        <div className="adm-teams-grid">
          {filtered.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              onEdit={openEdit}
              onDelete={setConfirm}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Create new team' : `Edit team — ${target?.name}`}
          sub={
            modal === 'create'
              ? 'Assign a team lead and optionally add support agents.'
              : 'Update team name, lead, or agent membership.'
          }
          onClose={closeModal}
        >
          <TeamForm
            initial={target ?? undefined}
            allStaff={staff}
            onSave={handleSave}
            onClose={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {confirm && (
        <ConfirmDlg
          msg={`Delete team "${confirm.name}"? Members will be unassigned but their accounts will remain.`}
          onOk={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default TeamsSection;
