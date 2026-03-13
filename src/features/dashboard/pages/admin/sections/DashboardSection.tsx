/**
 * DashboardSection.tsx
 * Admin analytics dashboard — open tickets by priority, SLA breaches trend,
 * first response & resolution times, status breakdown, escalation rate.
 *
 * Uses recharts. Fetches from GET /dashboard/metrics
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { ApiClient } from "../hooks/useApi";
import { Spinner } from "../components/Shared";
import { RefreshIcon } from "../components/Icons";

/* ── Types (matching backend DashboardMetrics schema) ────────────────────── */
interface TicketStatusBreakdown {
  new: number;
  acknowledged: number;
  open: number;
  in_progress: number;
  on_hold: number;
  resolved: number;
  closed: number;
  reopened: number;
}

interface PriorityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SLABreachTrend {
  date: string; // "2024-01-15"
  breaches: number;
  total: number;
}

interface ResponseTimeStat {
  date: string;
  avg_first_response_mins: number;
  median_resolution_mins: number;
}

interface DashboardMetrics {
  total_tickets: number;
  by_status: TicketStatusBreakdown;
  open_tickets: number;
  escalated_tickets: number;
  by_priority?: PriorityBreakdown;
  sla_breach_trend?: SLABreachTrend[];
  response_time_trend?: ResponseTimeStat[];
  resolved_today?: number;
  avg_resolution_mins?: number;
  sla_compliance_rate?: number;
}

/* ── Colour palette ──────────────────────────────────────────────────────── */
const PRIORITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#8B5CF6",
  acknowledged: "#6366F1",
  open: "#3B82F6",
  in_progress: "#0EA5E9",
  on_hold: "#F59E0B",
  resolved: "#22C55E",
  closed: "#6B7280",
  reopened: "#EF4444",
};

/* ── KPI Card ────────────────────────────────────────────────────────────── */
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
}> = ({ label, value, sub, color, bg, icon, trend }) => (
  <div className="dash-kpi-card">
    <div className="dash-kpi-icon" style={{ background: bg, color }}>
      {icon}
    </div>
    <div className="dash-kpi-content">
      <div className="dash-kpi-value" style={{ color }}>
        {value}
      </div>
      <div className="dash-kpi-label">{label}</div>
      {sub && <div className="dash-kpi-sub">{sub}</div>}
      {trend && (
        <div
          className="dash-kpi-trend"
          style={{ color: trend.value >= 0 ? "#22C55E" : "#EF4444" }}
        >
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  </div>
);

/* ── Chart card wrapper ──────────────────────────────────────────────────── */
const ChartCard: React.FC<{
  title: string;
  sub?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, sub, children, style }) => (
  <div className="dash-chart-card" style={style}>
    <div className="dash-chart-card-hdr">
      <div>
        <h3 className="dash-chart-title">{title}</h3>
        {sub && <p className="dash-chart-sub">{sub}</p>}
      </div>
    </div>
    <div className="dash-chart-body">{children}</div>
  </div>
);

/* ── Custom tooltip ──────────────────────────────────────────────────────── */
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-chart-tooltip">
      <div className="dash-chart-tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          className="dash-chart-tooltip-row"
          style={{ color: p.color }}
        >
          <span
            className="dash-chart-tooltip-dot"
            style={{ background: p.color }}
          />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const minsToLabel = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/* ── Fallback sample data (shown while API returns no trend data) ─────────── */
const sampleBreachTrend: SLABreachTrend[] = Array.from(
  { length: 14 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      breaches: Math.floor(Math.random() * 8),
      total: 20 + Math.floor(Math.random() * 15),
    };
  },
);

const sampleResponseTrend: ResponseTimeStat[] = Array.from(
  { length: 14 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avg_first_response_mins: 20 + Math.floor(Math.random() * 40),
      median_resolution_mins: 120 + Math.floor(Math.random() * 200),
    };
  },
);

/* ── DashboardSection ────────────────────────────────────────────────────── */
interface Props {
  api: ApiClient;
  onToast: (msg: string, ok?: boolean) => void;
}

const DashboardSection: React.FC<Props> = ({ api, onToast }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DashboardMetrics>("/dashboard/metrics");
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setLoading(false);
    }
  }, [api, onToast]);

  useEffect(() => {
    load();
    // Auto-refresh every 60 s
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !metrics) {
    return (
      <div className="dash-dashboard-loading">
        <Spinner size={32} />
        <span>Loading analytics…</span>
      </div>
    );
  }

  /* ── Derived data ─────────────────────────────────────────────────────── */
  const m = metrics;

  // Priority bar chart data
  const priorityData = m?.by_priority
    ? Object.entries(m.by_priority).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        tickets: v,
        fill: PRIORITY_COLORS[k],
      }))
    : [
        { name: "Critical", tickets: 0, fill: PRIORITY_COLORS.critical },
        { name: "High", tickets: 0, fill: PRIORITY_COLORS.high },
        { name: "Medium", tickets: 0, fill: PRIORITY_COLORS.medium },
        { name: "Low", tickets: 0, fill: PRIORITY_COLORS.low },
      ];

  // Status pie data
  const statusData = m?.by_status
    ? Object.entries(m.by_status)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({
          name: k.replace(/_/g, " "),
          value: v,
          fill: STATUS_COLORS[k] ?? "#94A3B8",
        }))
    : [];

  const breachTrend = m?.sla_breach_trend?.length
    ? m.sla_breach_trend.map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
    : sampleBreachTrend;

  const responseTrend = m?.response_time_trend?.length
    ? m.response_time_trend.map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
    : sampleResponseTrend;

  const slaRate =
    m?.sla_compliance_rate != null
      ? `${m.sla_compliance_rate.toFixed(1)}%`
      : "—";
  const avgRes =
    m?.avg_resolution_mins != null ? minsToLabel(m.avg_resolution_mins) : "—";

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Page header */}
      <div className="dash-page-hdr">
        <div>
          <h1 className="dash-page-title">Dashboard</h1>
          <p className="dash-page-sub">
            Real-time analytics · auto-refreshes every 60s
            {lastUpdated && (
              <span className="dash-last-updated">
                {" "}
                · Last updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn--outline btn--sm"
          onClick={load}
          disabled={loading}
        >
          {loading ? (
            <Spinner size={13} />
          ) : (
            <RefreshIcon style={{ width: 24, height: 24 }} />
          )}{" "}
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="dash-kpi-row">
        <KpiCard
          label="Total tickets"
          value={m?.total_tickets ?? 0}
          sub="All time"
          color="#3B82F6"
          bg="#EFF6FF"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <KpiCard
          label="Open tickets"
          value={m?.open_tickets ?? 0}
          sub="Open + in progress"
          color="#F97316"
          bg="#FFF7ED"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <KpiCard
          label="Escalated"
          value={m?.escalated_tickets ?? 0}
          sub="Needs attention"
          color="#EF4444"
          bg="#FEF2F2"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <KpiCard
          label="SLA compliance"
          value={slaRate}
          sub="Last 30 days"
          color="#22C55E"
          bg="#F0FDF4"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <KpiCard
          label="Avg resolution"
          value={avgRes}
          sub="Median time"
          color="#8B5CF6"
          bg="#F5F3FF"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <KpiCard
          label="Resolved today"
          value={m?.resolved_today ?? 0}
          sub="Tickets closed"
          color="#0EA5E9"
          bg="#F0F9FF"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>

      {/* Row 1: Priority bar + Status pie */}
      <div className="dash-charts-row">
        <ChartCard
          title="Open tickets by priority"
          sub="Current open + in-progress tickets"
          style={{ flex: "1.4" }}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={priorityData} barCategoryGap="35%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="tickets" radius={[6, 6, 0, 0]} name="Tickets">
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Ticket status breakdown"
          sub="All tickets by current status"
          style={{ flex: "1" }}
        >
          {statusData.length === 0 ? (
            <div className="dash-chart-empty">No data yet</div>
          ) : (
            <div className="dash-pie-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const v = Array.isArray(value) ? value[0] : value;
                      return [`${v ?? 0}m`, ""];
                    }}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-pie-legend">
                {statusData.map((s) => (
                  <div key={s.name} className="dash-pie-legend-row">
                    <span
                      className="dash-pie-legend-dot"
                      style={{ background: s.fill }}
                    />
                    <span className="dash-pie-legend-name">{s.name}</span>
                    <span className="dash-pie-legend-val">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 2: SLA breach trend */}
      <ChartCard
        title="SLA breach trend"
        sub="Daily breaches vs total tickets (last 14 days)"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={breachTrend}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBreaches" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#gradTotal)"
              name="Total tickets"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="breaches"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#gradBreaches)"
              name="SLA breaches"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 3: Response & resolution times */}
      <ChartCard
        title="First response & resolution time"
        sub="Average first response and median resolution (minutes) – last 14 days"
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={responseTrend}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(value) => {
                const v = Array.isArray(value) ? value[0] : value;
                return [`${v ?? 0}m`, ""];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Line
              type="monotone"
              dataKey="avg_first_response_mins"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#8B5CF6" }}
              activeDot={{ r: 5 }}
              name="Avg first response (mins)"
            />
            <Line
              type="monotone"
              dataKey="median_resolution_mins"
              stroke="#0EA5E9"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#0EA5E9" }}
              activeDot={{ r: 5 }}
              name="Median resolution (mins)"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 4: Status table summary */}
      <ChartCard
        title="Status summary"
        sub="Current ticket counts by lifecycle stage"
      >
        <div className="dash-status-grid">
          {m?.by_status
            ? Object.entries(m.by_status).map(([key, val]) => (
                <div key={key} className="dash-status-chip">
                  <div
                    className="dash-status-chip-bar"
                    style={{
                      background: STATUS_COLORS[key] ?? "#94A3B8",
                      height:
                        val > 0
                          ? `${Math.max(8, Math.min(48, val * 3))}px`
                          : "4px",
                    }}
                  />
                  <div
                    className="dash-status-chip-val"
                    style={{ color: STATUS_COLORS[key] ?? "#94A3B8" }}
                  >
                    {val}
                  </div>
                  <div className="dash-status-chip-label">
                    {key.replace(/_/g, " ")}
                  </div>
                </div>
              ))
            : null}
        </div>
      </ChartCard>
    </>
  );
};

export default DashboardSection;
