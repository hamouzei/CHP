'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../services/api';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  User,
  Calendar,
  Building2,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  FileText,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-white/50', bgColor: 'bg-white/05 border-white/10', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', icon: Activity },
  under_review: { label: 'Under Review', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/20', icon: Target },
  revision_requested: { label: 'Revision Requested', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
  approved: { label: 'Approved', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'text-white/50', bgColor: 'bg-white/05 border-white/10', icon: XCircle },
};

const MATURITY_COLORS: Record<string, string> = {
  'Non-Existent': '#ef4444',
  'Nascent': '#f97316',
  'Emerging': '#eab308',
  'Developing': '#22c55e',
  'Established': '#06b6d4',
  'Matured': '#8b5cf6',
};

export default function AssessmentOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/assessments/${id}`),
    enabled: !!id && !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-[#0072BC] animate-spin" />
          <span className="text-sm text-white/50">Loading assessment details...</span>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-3xl p-8 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-white/70 font-medium">
            {(error as any)?.message || 'Assessment not found'}
          </p>
          <Link
            href="/assessments"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#0072BC]/80 bg-[#0072BC]/10 border border-[#0072BC]/25 hover:bg-[#0072BC]/20 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[assessment.status] || STATUS_MAP.draft;
  const StatusIcon = statusInfo.icon;
  const chpmi = assessment.chpmiScore ? Number(assessment.chpmiScore) : 0;
  const bandLabel = assessment.maturityBand?.label || 'Non-Existent';
  const bandColor = MATURITY_COLORS[bandLabel] || '#64748b';

  // Count scored criteria
  const totalCriteria = assessment.responses?.length || 0;
  const scoredCriteria = assessment.responses?.filter((r: any) => r.score !== null).length || 0;
  const progressPct = totalCriteria > 0 ? Math.round((scoredCriteria / totalCriteria) * 100) : 0;

  // Recent review comments
  const comments = assessment.reviewComments || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Assessments
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-xs font-bold text-white/70">{assessment.cycleName}</span>
      </div>

      {/* Main Info Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#0072BC]/10 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusInfo.bgColor} ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </span>
              {assessment.assessmentType && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/08 border border-white/10/40 text-white/50">
                  {assessment.assessmentType}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              {assessment.cycleName}
            </h1>

            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Building2 className="h-3.5 w-3.5 text-white/40" />
                <span className="font-semibold text-white/70">{assessment.organization?.name}</span>
              </div>
              {assessment.assessmentPeriod && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Calendar className="h-3.5 w-3.5 text-white/40" />
                  <span>Period: {assessment.assessmentPeriod}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Calendar className="h-3.5 w-3.5 text-white/40" />
                <span>Created: {new Date(assessment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* CHPMI Score Card */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="text-center">
              <div className="text-5xl font-black text-white tracking-tight">{chpmi.toFixed(1)}<span className="text-2xl text-white/40">%</span></div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">CHPMI Score</div>
              <span
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase border"
                style={{
                  color: bandColor,
                  borderColor: `${bandColor}30`,
                  backgroundColor: `${bandColor}10`,
                }}
              >
                <Sparkles className="h-3 w-3" />
                {bandLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden hover:transform-none">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Scoring Progress</div>
          <div className="text-2xl font-black text-white">{scoredCriteria}<span className="text-sm text-white/40">/{totalCriteria}</span></div>
          <div className="w-full h-1.5 bg-[#003366]/60 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-[10px] text-white/40 mt-1">{progressPct}% complete</div>
        </div>

        {/* Assessor */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden hover:transform-none">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Assigned Assessor</div>
          {assessment.assignedAssessor ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0072BC]/20 border border-[#0072BC]/30 flex items-center justify-center">
                <User className="h-4 w-4 text-[#0072BC]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{assessment.assignedAssessor.fullName}</div>
                <div className="text-[10px] text-white/40">{assessment.assignedAssessor.email}</div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-white/30">Not assigned</span>
          )}
        </div>

        {/* Reviewer */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden hover:transform-none">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Assigned Reviewer</div>
          {assessment.assignedReviewer ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                <User className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{assessment.assignedReviewer.fullName}</div>
                <div className="text-[10px] text-white/40">{assessment.assignedReviewer.email}</div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-white/30">Not assigned</span>
          )}
        </div>

        {/* Review Comments Count */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden hover:transform-none">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Review Comments</div>
          <div className="text-2xl font-black text-white">{comments.length}</div>
          <div className="text-[10px] text-white/40 mt-1">
            {comments.length === 0 ? 'No comments yet' : `Last: ${new Date(comments[0].createdAt).toLocaleDateString()}`}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/assessments/${id}/scoring`}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#0072BC] to-[#0072BC]/80 hover:from-[#005a94] hover:to-[#0072BC] shadow-lg shadow-[#0072BC]/15 transition-all active:scale-[0.98]"
        >
          <ClipboardList className="h-4 w-4" />
          {assessment.status === 'approved' ? 'View Scoring' : 'Continue Scoring'}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        {(assessment.status === 'under_review' || assessment.status === 'approved') && (
          <Link
            href={`/assessments/${id}/review`}
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold text-cyan-300 bg-cyan-600/10 border border-cyan-500/20 hover:bg-cyan-600/20 transition-all active:scale-[0.98]"
          >
            <Target className="h-4 w-4" />
            Review
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
        <Link
          href={`/assessments/${id}/report`}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold text-emerald-300 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all active:scale-[0.98]"
        >
          <FileText className="h-4 w-4" />
          Reports
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Recent Review Comments */}
      {comments.length > 0 && (
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            Recent Review Comments
          </h2>
          <div className="space-y-3">
            {comments.slice(0, 5).map((comment: any) => (
              <div key={comment.id} className="p-4 rounded-2xl bg-[#003366]/30 border border-white/08">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                      <User className="h-3 w-3 text-cyan-400" />
                    </div>
                    <span className="text-xs font-bold text-white/70">{comment.commentedBy?.fullName || 'Unknown'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/08 text-white/40">
                      {comment.commentType?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/30">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
