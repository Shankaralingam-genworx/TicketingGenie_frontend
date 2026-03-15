import React, { useEffect, useState } from 'react';
import { Issue, IssueResolver } from '../types';
import { ApiClient } from '../hooks/useApi';
import {
  Spinner,
  ActivePill,
  ConfirmDlg,
  Field,
  Select,
} from '../components/Shared';
import { MapIcon, PlusIcon, RefreshIcon, TrashIcon } from '../components/Icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamOption {
  id: number;
  name: string;
  team_lead_id: number;
}

interface Props {
  resolvers: IssueResolver[];
  issues:    Issue[];
  loading:   boolean;
  onRefresh: () => void;
  api:       ApiClient;
  onToast:   (msg: string, ok?: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ResolversSection: React.FC<Props> = ({
  resolvers,
  issues,
  loading,
  onRefresh,
  api,
  onToast,
}) => {
  const [showForm,  setShowForm]  = useState(false);
  const [issueId,   setIssueId]   = useState('');
  const [teamId,    setTeamId]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [confirm,   setConfirm]   = useState<IssueResolver | null>(null);
  const [filterTeam, setFilterTeam] = useState<number | 'all'>('all');

  const [teams,        setTeams]        = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const issueMap = Object.fromEntries(issues.map((i) => [i.id, i]));
  const teamMap  = Object.fromEntries(teams.map((t) => [t.id, t]));

  // ── Fetch teams ───────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchTeams = async () => {
      setTeamsLoading(true);
      try {
        const data = await api.get<TeamOption[]>('/admin/teams_dropdown', 'auth');
        setTeams(data);
      } catch (e: any) {
        onToast(`Failed to load teams: ${e.message}`, false);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, [api, onToast]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!issueId || !teamId) return;
    setSaving(true);
    try {
      const selectedTeam = teamMap[Number(teamId)];
      await api.post('/issue-resolvers/', {
        issue_id:  Number(issueId),
        team_id:   Number(teamId),
        team_name: selectedTeam?.name ?? null,
      });
      onToast('Resolver mapping created');
      setIssueId('');
      setTeamId('');
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: IssueResolver) => {
    try {
      await api.delete(`/issue-resolvers/${r.id}`);
      onToast('Resolver mapping removed');
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    }
    setConfirm(null);
  };

  // ── Group by team ─────────────────────────────────────────────────────────

  const filtered = resolvers.filter(
    (r) => filterTeam === 'all' || r.team_id === filterTeam,
  );

  const byTeam: Record<number, IssueResolver[]> = {};
  filtered.forEach((r) => {
    (byTeam[r.team_id] ??= []).push(r);
  });

  // Unique teams that actually have resolvers (for filter dropdown)
  const usedTeamIds = [...new Set(resolvers.map((r) => r.team_id))];

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="adm-section-hdr">
        <div>
          <h1 className="dash-page-title">Skill Mapping</h1>
          <p className="dash-page-sub">
            Assign teams as primary resolvers for each issue type.
          </p>
        </div>
        <div className="adm-hdr-actions">
          <button
            className="btn btn--outline btn--sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshIcon style={{ width: '24px', height: '24px' }} /> Refresh
          </button>
          <button
            className="btn btn--primary"
            onClick={() => setShowForm((s) => !s)}
          >
            <PlusIcon /> Add resolver
          </button>
        </div>
      </div>

      {/* ── Inline create form ───────────────────────────────────────────── */}
      {showForm && (
        <div className="adm-inline-form">
          <h4 className="adm-inline-form-title">New Issue → Team resolver</h4>
          <div className="adm-inline-form-row">

            <Field label="Issue type" required>
              <Select value={issueId} onChange={(e) => setIssueId(e.target.value)}>
                <option value="">Select an issue…</option>
                {issues
                  .filter((i) => i.is_active)
                  .map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
              </Select>
            </Field>

            <Field label="Team" required>
              {teamsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38 }}>
                  <Spinner size={16} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                    Loading teams…
                  </span>
                </div>
              ) : (
                <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                  <option value="">Select a team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="adm-inline-form-btns">
              <button
                className="btn btn--outline"
                onClick={() => { setShowForm(false); setIssueId(''); setTeamId(''); }}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                disabled={!issueId || !teamId || saving}
                onClick={handleCreate}
              >
                {saving ? <><Spinner size={14} color="white" /> Saving…</> : 'Add resolver'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Filter by team ───────────────────────────────────────────────── */}
      <div className="adm-filter-row">
        <label className="adm-label" style={{ marginBottom: 0 }}>
          Filter by team:
        </label>
        <Select
          value={filterTeam === 'all' ? 'all' : String(filterTeam)}
          style={{ width: 'auto', minWidth: 240 }}
          onChange={(e) =>
            setFilterTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
        >
          <option value="all">All teams ({resolvers.length} mappings)</option>
          {usedTeamIds.map((tid) => {
            const name = teamMap[tid]?.name ?? `Team #${tid}`;
            const count = resolvers.filter((r) => r.team_id === tid).length;
            return (
              <option key={tid} value={tid}>
                {name} ({count})
              </option>
            );
          })}
        </Select>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="adm-loading">
          <Spinner size={22} />
          <span>Loading…</span>
        </div>
      ) : Object.keys(byTeam).length === 0 ? (
        <div
          className="adm-empty"
          style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12 }}
        >
          <MapIcon />
          <p>No resolver mappings found</p>
          <span>Add a mapping to assign teams as default resolvers for issue types.</span>
        </div>
      ) : (
        <div className="adm-resolver-cards">
          {Object.entries(byTeam).map(([tId, recs]) => {
            const team      = teamMap[Number(tId)];
            const teamName  = team?.name ?? recs[0]?.team_name ?? `Team #${tId}`;
            const initials  = teamName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={tId} className="dash-table-wrap">

                {/* Card header — team identity */}
                <div className="dash-table-hdr">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Team avatar */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div>
                      <h3 style={{ margin: 0 }}>{teamName}</h3>
                      <p style={{ margin: 0 }}>
                        {recs.length} issue{recs.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  {/* Active pill for the team itself if available */}
                  {team && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 99,
                      background: '#F0FDF4',
                      color: '#15803D',
                      border: '1px solid #BBF7D0',
                    }}>
                      Active
                    </span>
                  )}
                </div>

                {/* Issue rows */}
                <table>
                  <thead>
                    <tr>
                      <th>Issue</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map((r) => {
                      const issue = issueMap[r.issue_id];
                      return (
                        <tr key={r.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                background: 'var(--blue-50)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--blue-600)' }}>
                                  #{r.issue_id}
                                </span>
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                {issue?.name ?? `Issue #${r.issue_id}`}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--slate-500)', fontSize: '0.82rem' }}>
                            {issue?.category?.replace(/_/g, ' ') ?? '—'}
                          </td>
                          <td><ActivePill on={r.is_active} /></td>
                          <td>
                            <button
                              className="btn btn--outline btn--sm adm-btn-del"
                              onClick={() => setConfirm(r)}
                            >
                              <TrashIcon /> Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm delete dialog ────────────────────────────────────────── */}
      {confirm && (
        <ConfirmDlg
          msg={`Remove "${issueMap[confirm.issue_id]?.name ?? `Issue #${confirm.issue_id}`}" from ${
            teamMap[confirm.team_id]?.name ?? confirm.team_name ?? `Team #${confirm.team_id}`
          }?`}
          onOk={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default ResolversSection;  