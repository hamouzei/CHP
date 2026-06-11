'use client';

import React, { useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  FileText,
  FileSpreadsheet,
  Activity,
  Target,
  BarChart3,
  Radar,
  Loader2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell,
  Legend,
} from 'recharts';

/* ─── Types ─── */
interface LatestAssessment {
  id: string;
  cycleName: string;
  status: string;
  chpmiScore: number;
  maturityBand: string;
  updatedAt: string;
}

interface TrendPoint {
  assessmentId: string;
  cycleName: string;
  chpmiScore: number;
  maturityBand: string;
  date: string;
}

interface ComponentScore {
  componentId: string;
  componentCode: string;
  componentName: string;
  domainId: string;
  domainCode: string;
  domainName: string;
  rawScore: number;
  scorePct: number;
}

interface DomainScore {
  domainId: string;
  domainCode: string;
  domainName: string;
  scorePct: number;
}

interface AssessmentSummary {
  id: string;
  cycleName: string;
  status: string;
  chpmiScore: number;
  maturityBand: string;
  createdAt: string;
}

interface DashboardData {
  latestAssessment: LatestAssessment | null;
  trends: TrendPoint[];
  priorityGaps: ComponentScore[];
  componentScores: ComponentScore[];
  domainScores: DomainScore[];
  allAssessments: AssessmentSummary[];
  organizationCount?: number;
}

/* ─── Helpers ─── */
const MATURITY_COLORS: Record<string, string> = {
  'Non-Existent': '#ef4444',
  'Nascent': '#f97316',
  'Emerging': '#eab308',
  'Developing': '#22c55e',
  'Established': '#06b6d4',
  'Matured': '#8b5cf6',
};

const DOMAIN_COLORS = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-gray-500', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-amber-600', icon: Activity },
  under_review: { label: 'Under Review', color: 'text-cyan-600', icon: Target },
  revision_requested: { label: 'Revision Requested', color: 'text-orange-600', icon: AlertTriangle },
  approved: { label: 'Approved', color: 'text-emerald-600', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-600', icon: XCircle },
};

function getBandColor(band: string) {
  return MATURITY_COLORS[band] || '#64748b';
}

/* ─── CHPMI Gauge Ring ─── */
function ChpmiGauge({ score, band }: { score: number; band: string }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const color = getBandColor(band);

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      <svg className="transform -rotate-90 w-48 h-48" viewBox="0 0 160 160">
        {/* Background ring */}
        <circle
          cx="80" cy="80" r={radius}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress ring */}
        <circle
          cx="80" cy="80" r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-gray-900 tracking-tight">
          {pct.toFixed(1)}
        </span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
          CHPMI %
        </span>
      </div>
    </div>
  );
}

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-bold text-gray-700 mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-xs" style={{ color: entry.color || '#0072BC' }}>
          <span className="font-semibold">{entry.name}: </span>
          {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [exportingExcel, setExportingExcel] = React.useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  // Redirect non-admin roles to assessments, unauthenticated to login
  React.useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (!isAdmin) {
      router.replace('/assessments');
    }
  }, [user, isAdmin, router]);

  // Determine API endpoint based on role
  const dashboardEndpoint = user?.role === 'super_admin'
    ? '/dashboard/platform'
    : `/dashboard/organization/${user?.organizationId}`;

  // Use React Query for auto-refreshing dashboard data
  const { data, isLoading: loading, error: queryError, refetch: fetchDashboard } = useQuery<DashboardData>({
    queryKey: ['dashboard', user?.role, user?.organizationId],
    queryFn: () => api.get(dashboardEndpoint),
    enabled: isAdmin,
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    refetchOnWindowFocus: true,
  });

  const error = queryError ? (queryError as any).message || 'Failed to load dashboard' : null;

  /* ─── Radar data ─── */
  const radarData = useMemo(() => {
    if (!data?.domainScores) return [];
    return data.domainScores.map((d) => ({
      domain: d.domainCode,
      fullName: d.domainName,
      score: Math.round(d.scorePct * 100) / 100,
      fullMark: 100,
    }));
  }, [data?.domainScores]);

  /* ─── Bar data (sorted desc by score) ─── */
  const barData = useMemo(() => {
    if (!data?.componentScores) return [];
    return [...data.componentScores]
      .sort((a, b) => b.rawScore - a.rawScore)
      .map((c) => ({
        name: c.componentCode,
        fullName: c.componentName,
        score: c.rawScore,
        pct: c.scorePct,
        domain: c.domainCode,
      }));
  }, [data?.componentScores]);

  /* ─── Trend data ─── */
  const trendData = useMemo(() => {
    if (!data?.trends) return [];
    return data.trends.map((t) => ({
      name: t.cycleName,
      chpmi: t.chpmiScore,
      band: t.maturityBand,
      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }));
  }, [data?.trends]);

  /* ─── Export handlers ─── */
  const handleExportPdf = async (assessmentId: string) => {
    setExportingPdf(true);
    try {
      const response = await api.post(`/assessments/${assessmentId}/reports/pdf`);
      // response is a raw Response object for non-JSON
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CHP_Maturity_Report_${assessmentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async (assessmentId: string) => {
    setExportingExcel(true);
    try {
      const response = await api.post(`/assessments/${assessmentId}/reports/excel`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CHP_Maturity_Matrix_${assessmentId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Excel export error:', err);
      alert('Failed to generate Excel report. Please try again.');
    } finally {
      setExportingExcel(false);
    }
  };

  /* ─── Loading / Error States ─── */
  if (!user || !isAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-[#0072BC] animate-spin" />
          <span className="text-sm text-gray-500">Loading dashboard analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-gray-700 font-medium">{error}</p>
          <button onClick={() => fetchDashboard()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#0072BC] bg-[#0072BC]/10 border border-[#0072BC]/20 hover:bg-[#0072BC]/20 transition-all">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const latest = data?.latestAssessment;
  const hasData = !!latest && latest.chpmiScore > 0;
  const statusInfo = latest ? STATUS_MAP[latest.status] || STATUS_MAP.draft : STATUS_MAP.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* ─── Welcome Banner ─── */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0072BC] to-[#0096c7] rounded-t-2xl" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0072BC]/10 border border-[#0072BC]/20 text-xs font-bold text-[#0072BC] mb-3">
              <Shield className="h-3.5 w-3.5" />
              CHPMI Analytics Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              Welcome, {user.fullName}
            </h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              {data?.organizationCount !== undefined
                ? `Platform-wide analytics across ${data.organizationCount} active organization${data.organizationCount !== 1 ? 's' : ''} — CHPMI scores, domain radar, trend lines, and report exports.`
                : 'CHP Maturity Index analytics, domain radar, trend lines, and report exports.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0072BC] hover:bg-[#005a94] shadow-md transition-all active:scale-[0.98]"
            >
              Assessments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {latest && (
              <>
                <button
                  onClick={() => handleExportPdf(latest.id)}
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  Export PDF
                </button>
                <button
                  onClick={() => handleExportExcel(latest.id)}
                  disabled={exportingExcel}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {exportingExcel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                  Export Excel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── No Data State ─── */}
      {!hasData && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-700">No Assessment Data Yet</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Start your first maturity assessment to see CHPMI scores, domain radar charts, trend lines, and priority gap analysis here.
          </p>
          <Link
            href="/assessments"
            className="inline-flex items-center gap-2 mt-6 py-3 px-5 rounded-xl text-xs font-bold text-white bg-[#0072BC] hover:bg-[#005a94] transition-all"
          >
            Create Assessment <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ─── Main Analytics Grid ─── */}
      {hasData && latest && (
        <>
          {/* Row 1: CHPMI Gauge + Latest Info + Domain Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CHPMI Gauge Card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0072BC] to-[#0096c7] rounded-t-2xl" />
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-[#0072BC]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall Index</span>
              </div>
              <ChpmiGauge score={latest.chpmiScore} band={latest.maturityBand} />
              {/* Maturity Band Badge */}
              <div className="text-center mt-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border"
                  style={{
                    color: getBandColor(latest.maturityBand),
                    borderColor: `${getBandColor(latest.maturityBand)}30`,
                    backgroundColor: `${getBandColor(latest.maturityBand)}10`,
                  }}
                >
                  {latest.maturityBand}
                </span>
                <p className="text-[10px] text-gray-500 mt-2">{latest.cycleName}</p>
              </div>
            </div>

            {/* Latest Assessment Info Card */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-[#0072BC]" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Latest Assessment</span>
                </div>

                <h3 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">
                  {latest.cycleName}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Status</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${statusInfo.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Score</span>
                    <span className="font-extrabold text-gray-900">{Number(latest.chpmiScore).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Maturity</span>
                    <span className="font-bold" style={{ color: getBandColor(latest.maturityBand) }}>{latest.maturityBand}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Updated</span>
                    <span className="font-medium text-gray-700">{new Date(latest.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/assessments/${latest.id}/scoring`}
                className="mt-5 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0072BC] bg-[#0072BC]/10 border border-[#0072BC]/20 hover:bg-[#0072BC]/20 transition-all w-full"
              >
                Open Assessment <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Domain Radar Chart */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Radar className="h-4 w-4 text-[#0072BC]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Domain Radar</span>
              </div>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                    <PolarGrid stroke="#d1d5db" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="domain"
                      tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: '#9ca3af', fontSize: 8 }}
                      tickCount={5}
                    />
                    <RechartsRadar
                      name="Score %"
                      dataKey="score"
                      stroke="#0072BC"
                      fill="#0072BC"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">No domain data</div>
              )}
            </div>
          </div>

          {/* Row 2: Component Scores Bar Chart */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0072BC] to-[#0096c7] rounded-t-2xl" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#0072BC]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Component Scores (0–4 Scale)</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Sorted by score</span>
            </div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 4]} tick={{ fill: '#6b7280', fontSize: 10 }} tickCount={5} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={50}
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Score" radius={[0, 6, 6, 0]} barSize={18}>
                    {barData.map((entry, idx) => {
                      const domainCodes = (data?.domainScores || []).map(d => d.domainCode);
                      const domainIdx = domainCodes.indexOf(entry.domain);
                      return <Cell key={idx} fill={DOMAIN_COLORS[domainIdx >= 0 ? domainIdx % DOMAIN_COLORS.length : 0]} fillOpacity={0.85} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-xs text-gray-400">No component data</div>
            )}
            {/* Domain Color Legend */}
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {data?.domainScores?.map((d, i) => (
                <div key={d.domainCode} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: DOMAIN_COLORS[i] || '#64748b' }} />
                  <span className="font-semibold">{d.domainCode}</span>
                  <span>{d.domainName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Trend Chart + Priority Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Longitudinal Trend Chart */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-t-2xl" />
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">CHPMI Trend Over Time</span>
              </div>
              {trendData.length > 1 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="chpmi"
                      name="CHPMI %"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
                  <Activity className="h-8 w-8 text-gray-300" />
                  <span>Multiple assessments needed to show trends</span>
                  {trendData.length === 1 && (
                    <span className="text-[#0072BC] font-bold mt-1">
                      Current: {trendData[0].chpmi.toFixed(2)}% ({trendData[0].band})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Priority Gap Analysis */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 to-amber-400 rounded-t-2xl" />
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Priority Gaps (Lowest 3)</span>
              </div>

              {data?.priorityGaps && data.priorityGaps.length > 0 ? (
                <div className="space-y-3">
                  {data.priorityGaps.map((gap, idx) => {
                    const pct = (gap.rawScore / 4) * 100;
                    const severity = gap.rawScore <= 1 ? 'Critical' : gap.rawScore <= 2 ? 'Moderate' : 'Mild';
                    const sevColor = gap.rawScore <= 1 ? 'text-red-600' : gap.rawScore <= 2 ? 'text-amber-600' : 'text-yellow-600';
                    const barColor = gap.rawScore <= 1 ? 'bg-red-500' : gap.rawScore <= 2 ? 'bg-amber-500' : 'bg-yellow-500';
                    return (
                      <div
                        key={gap.componentId}
                        className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-[#0072BC] bg-[#0072BC]/10 border border-[#0072BC]/20 px-1.5 py-0.5 rounded">
                                {gap.componentCode}
                              </span>
                              <span className={`text-[10px] font-extrabold uppercase ${sevColor}`}>{severity}</span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-800">{gap.componentName}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{gap.domainName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-black text-gray-900">{gap.rawScore.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-400 block">/ 4.0</span>
                          </div>
                        </div>
                        {/* Mini bar */}
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-xs text-gray-400">
                  No gap data available
                </div>
              )}
            </div>
          </div>

          {/* Row 4: All Assessments Table */}
          {data?.allAssessments && data.allAssessments.length > 0 && (
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gray-300 to-gray-200 rounded-t-2xl" />
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assessment History</span>
                </div>
                <span className="text-[10px] text-gray-400">{data.allAssessments.length} total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cycle</th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">CHPMI</th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Band</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Created</th>
                      <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.allAssessments.map((a) => {
                      const si = STATUS_MAP[a.status] || STATUS_MAP.draft;
                      const SI = si.icon;
                      return (
                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-gray-800">
                            <Link href={`/assessments/${a.id}/scoring`} className="hover:text-[#0072BC] transition-colors inline-flex items-center gap-1">
                              {a.cycleName} <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 font-bold ${si.color}`}>
                              <SI className="h-3 w-3" /> {si.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-gray-900">{Number(a.chpmiScore).toFixed(2)}%</td>
                          <td className="py-3 px-3">
                            <span className="font-bold" style={{ color: getBandColor(a.maturityBand) }}>{a.maturityBand}</span>
                          </td>
                          <td className="py-3 px-3 text-right text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleExportPdf(a.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                title="Export PDF"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleExportExcel(a.id)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Export Excel"
                              >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
