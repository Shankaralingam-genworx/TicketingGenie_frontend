import React from 'react';
import { Issue, IssueResolver, SLA } from '../types';
import { ActivePill, SevBadge, TierBadge } from '../components/Shared';
import { IssueIcon, SLAIcon, MapIcon, UsersIcon } from '../components/Icons';
import { minsToHuman } from '../utils/time';

interface Props {
  issues: Issue[];
  slas: SLA[];
  resolvers: IssueResolver[];
}

const OverviewSection: React.FC<Props> = ({ issues, slas, resolvers }) => {
  const activeIssues = issues.filter((i) => i.is_active).length;
  const activeSLAs   = slas.filter((s) => s.is_active).length;
  const uniqueAgents = new Set(resolvers.map((r) => r.user_id)).size;

  const stats = [
    { label: 'Issue Types',    value: String(issues.length),    delta: `${activeIssues} active`,         icon: <IssueIcon />, color: '#EFF6FF', ic: '#2563EB' },
    { label: 'SLA Policies',   value: String(slas.length),      delta: `${activeSLAs} active`,           icon: <SLAIcon />,   color: '#F0FDF4', ic: '#22C55E' },
    { label: 'Agent Mappings', value: String(resolvers.length), delta: 'Issue → Agent pairs',            icon: <MapIcon />,   color: '#FFFBEB', ic: '#F59E0B' },
    { label: 'Agents Mapped',  value: String(uniqueAgents),     delta: 'Unique agents assigned',         icon: <UsersIcon />, color: '#F5F3FF', ic: '#7C3AED' },
  ];

  return (
    <>
      <div className="dash-page-hdr">
        <h1 className="dash-page-title">Admin Overview</h1>
        <p className="dash-page-sub">
          System configuration — issue types, SLA policies and agent assignments.
        </p>
      </div>

      <div className="dash-stats">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-icon" style={{ background: s.color }}>
              <span style={{ color: s.ic }}>{s.icon}</span>
            </div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-delta">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="adm-two-col">
        {/* Issues snapshot */}
        <div className="dash-table-wrap">
          <div className="dash-table-hdr">
            <div>
              <h3>Issue Types</h3>
              <p>Most recently created</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.slice(0, 6).map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.name}</td>
                  <td>
                    <span className="adm-cat-chip">
                      {i.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <ActivePill on={i.is_active} />
                  </td>
                </tr>
              ))}
              {issues.length === 0 && (
                <tr>
                  <td colSpan={3} className="adm-empty-cell">
                    No issue types configured
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SLA snapshot */}
        <div className="dash-table-wrap">
          <div className="dash-table-hdr">
            <div>
              <h3>Active SLA Policies</h3>
              <p>Response time targets</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Tier</th>
                <th>Response</th>
                <th>Resolution</th>
              </tr>
            </thead>
            <tbody>
              {slas
                .filter((s) => s.is_active)
                .slice(0, 6)
                .map((s) => (
                  <tr key={s.id}>
                    <td>
                      <SevBadge sev={s.severity} />
                    </td>
                    <td>
                      <TierBadge tier={s.customer_tier} />
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--blue-600)' }}>
                      {minsToHuman(s.response_time_mins)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {minsToHuman(s.resolution_time_mins)}
                    </td>
                  </tr>
                ))}
              {slas.length === 0 && (
                <tr>
                  <td colSpan={4} className="adm-empty-cell">
                    No SLA policies configured
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default OverviewSection;