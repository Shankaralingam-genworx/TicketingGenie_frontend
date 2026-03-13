import React, { useEffect, useRef, useState } from 'react';
import { Issue, IssueResolver } from '../types';
import { ApiClient } from '../hooks/useApi';
import {
  Spinner,
  ActivePill,
  ConfirmDlg,
  Field,
  Input,
  Select,
} from '../components/Shared';
import { IssueIcon, MapIcon, PlusIcon, RefreshIcon, TrashIcon } from '../components/Icons';

// ── Team dropdown type ────────────────────────────────────────────────────────
interface TeamOption {
  id: number;
  name: string;
  team_lead_id: number;
}

interface Props {
  resolvers: IssueResolver[];
  issues: Issue[];
  loading: boolean;
  onRefresh: () => void;
  api: ApiClient;
  onToast: (msg: string, ok?: boolean) => void;
}

const ResolversSection: React.FC<Props> = ({
  resolvers,
  issues,
  loading,
  onRefresh,
  api,
  onToast,
}) => {
  const [showForm,   setShowForm]   = useState(false);
  const [issueId,    setIssueId]    = useState('');
  const [teamId,     setTeamId]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [confirm,    setConfirm]    = useState<IssueResolver | null>(null);
  const [filterIss,  setFilterIss]  = useState<number | 'all'>('all');

  // ── Teams dropdown state ──────────────────────────────────────────────────
  const [teams,        setTeams]        = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const issueMap = Object.fromEntries(issues.map((i) => [i.id, i]));
  const teamMap  = Object.fromEntries(teams.map((t) => [t.id, t]));

  // ── Fetch teams on mount ──────────────────────────────────────────────────
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

  const filtered = resolvers.filter(
    (r) => filterIss === 'all' || r.issue_id === filterIss,
  );

  // Group by issue for card-per-issue layout
  const byIssue: Record<number, IssueResolver[]> = {};
  filtered.forEach((r) => {
    (byIssue[r.issue_id] ??= []).push(r);
  });

  return (
    <>
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
            <RefreshIcon style={{ width: "24px", height: "24px" }} /> Refresh
          </button>
          <button
            className="btn btn--primary"
            onClick={() => setShowForm((s) => !s)}
          >
            <PlusIcon /> Add resolver
          </button>
        </div>
      </div>

      {/* ── Inline create form ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="adm-inline-form">
          <h4 className="adm-inline-form-title">New Issue → Team resolver</h4>
          <div className="adm-inline-form-row">

            <Field label="Issue type" required>
              <Select
                value={issueId}
                onChange={(e) => setIssueId(e.target.value)}
              >
                <option value="">Select an issue…</option>
                {issues
                  .filter((i) => i.is_active)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
              </Select>
            </Field>

            {/* ── Team dropdown from backend ─────────────────────────────── */}
            <Field label="Team" required>
              {teamsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38 }}>
                  <Spinner size={16} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                    Loading teams…
                  </span>
                </div>
              ) : (
                <Select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  <option value="">Select a team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="adm-inline-form-btns">
              <button
                className="btn btn--outline"
                onClick={() => {
                  setShowForm(false);
                  setIssueId('');
                  setTeamId('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                disabled={!issueId || !teamId || saving}
                onClick={handleCreate}
              >
                {saving ? (
                  <><Spinner size={14} color="white" /> Saving…</>
                ) : (
                  'Add resolver'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Filter by issue ─────────────────────────────────────────────────── */}
      <div className="adm-filter-row">
        <label className="adm-label" style={{ marginBottom: 0 }}>
          Filter by issue:
        </label>
        <Select
          value={filterIss === 'all' ? 'all' : String(filterIss)}
          style={{ width: 'auto', minWidth: 240 }}
          onChange={(e) =>
            setFilterIss(
              e.target.value === 'all' ? 'all' : Number(e.target.value),
            )
          }
        >
          <option value="all">All issues ({resolvers.length} mappings)</option>
          {issues.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="adm-loading">
          <Spinner size={22} />
          <span>Loading…</span>
        </div>
      ) : Object.keys(byIssue).length === 0 ? (
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
          {Object.entries(byIssue).map(([issId, recs]) => {
            const issue = issueMap[Number(issId)];
            return (
              <div key={issId} className="dash-table-wrap">
                <div className="dash-table-hdr">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="adm-issue-icon-wrap"><IssueIcon /></div>
                    <div>
                      <h3>{issue?.name ?? `Issue #${issId}`}</h3>
                      <p>
                        {issue?.category?.replace(/_/g, ' ')}
                        {' · '}
                        {recs.length} team{recs.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  {issue && <ActivePill on={issue.is_active} />}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Team</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="adm-id">#{r.id}</span>
                        </td>
                        <td>
                          <div className="adm-agent-cell">
                            <div className="adm-agent-avatar">
                              {String(r.team_id).padStart(2, '0').slice(-2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {/* Prefer live team name from dropdown, fall back to stored name */}
                                {teamMap[r.team_id]?.name ?? r.team_name ?? `Team #${r.team_id}`}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                                ID: {r.team_id}
                              </div>
                            </div>
                          </div>
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
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <ConfirmDlg
          msg={`Remove the resolver mapping between "${
            issueMap[confirm.issue_id]?.name ?? `issue #${confirm.issue_id}`
          }" and ${
            teamMap[confirm.team_id]?.name ?? confirm.team_name
              ? `"${teamMap[confirm.team_id]?.name ?? confirm.team_name}"`
              : `team #${confirm.team_id}`
          }?`}
          onOk={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default ResolversSection;