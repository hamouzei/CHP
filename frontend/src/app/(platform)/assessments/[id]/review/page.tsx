'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  Shield,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  FileCheck2,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileTitle: string;
  fileType: string;
  storageUrl: string;
}

interface Criterion {
  id: string;
  code: string;
  name: string;
  component: {
    name: string;
    domain: {
      name: string;
    };
  };
}

interface ResponseData {
  id: string;
  criteriaId: string;
  score: number | null;
  justification: string;
  evidenceFiles: EvidenceFile[];
  criterion: Criterion;
}

interface ReviewComment {
  id: string;
  comment: string;
  commentType: 'approval_note' | 'revision_request' | 'general_comment';
  createdAt: string;
  commentedBy: {
    fullName: string;
    role: string;
  };
}

interface Assessment {
  id: string;
  cycleName: string;
  assessmentPeriod: string | null;
  assessmentType: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'approved' | 'revision_requested' | 'archived';
  chpmiScore: number;
  organization: {
    name: string;
  };
  maturityBand: {
    label: string;
  } | null;
  responses: ResponseData[];
  reviewComments: ReviewComment[];
}

export default function AssessmentReviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch assessment
  const { data: assessment, isLoading, error: fetchErr } = useQuery<Assessment>({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/assessments/${id}`),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (variables: { comment: string }) => api.post(`/assessments/${id}/approve`, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      router.push('/assessments');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to approve assessment.');
    },
  });

  // Request Revision mutation
  const revisionMutation = useMutation({
    mutationFn: (variables: { comment: string }) => api.post(`/assessments/${id}/request-revision`, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      router.push('/assessments');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to request revisions.');
    },
  });

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading assessment audit details...</span>
      </div>
    );
  }

  if (fetchErr || !assessment) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center border-red-500/20 text-red-400 max-w-xl mx-auto mt-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-200">Failed to Load Review Details</h3>
        <p className="text-xs text-slate-400 mt-1">{(fetchErr as any)?.message || 'Assessment records not found.'}</p>
        <Link href="/assessments" className="mt-4 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to List
        </Link>
      </div>
    );
  }

  const handleApprove = () => {
    setError(null);
    approveMutation.mutate({ comment: comment || 'Assessment approved by Reviewer.' });
  };

  const handleRevision = () => {
    setError(null);
    if (!comment.trim()) {
      setError('A review comment detailing requested corrections is mandatory when requesting revisions.');
      return;
    }
    revisionMutation.mutate({ comment });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300';
      case 'under_review':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300';
      case 'revision_requested':
        return 'bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/30 text-rose-300';
      default:
        return 'bg-slate-800 border border-slate-700 text-slate-300';
    }
  };

  const isReviewActive = assessment.status === 'under_review' && (user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'super_admin');

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/assessments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Manager
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Review: {assessment.cycleName}
          </h1>
          <p className="text-xs text-slate-400">
            Organization: <strong className="text-slate-300 font-semibold">{assessment.organization.name}</strong> • Period: <strong className="text-slate-300 font-semibold">{assessment.assessmentPeriod || 'N/A'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center self-start sm:self-auto">
          <button
            onClick={async () => {
              try {
                const r = await api.post(`/assessments/${id}/reports/pdf`);
                const blob = await r.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `CHP_Report_${id}.pdf`; a.click(); window.URL.revokeObjectURL(url);
              } catch { alert('PDF export failed'); }
            }}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-2xl text-[11px] font-bold text-red-300 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 transition-all active:scale-[0.98]"
          >
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
          <button
            onClick={async () => {
              try {
                const r = await api.post(`/assessments/${id}/reports/excel`);
                const blob = await r.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `CHP_Matrix_${id}.xlsx`; a.click(); window.URL.revokeObjectURL(url);
              } catch { alert('Excel export failed'); }
            }}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-2xl text-[11px] font-bold text-emerald-300 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${getStatusBadge(assessment.status)}`}>
            <Clock className="h-4 w-4" />
            {assessment.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Review Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Criteria Score Breakdown */}
        <div className="xl:col-span-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-200">Framework Criteria Scores</h3>
          
          <div className="space-y-4">
            {assessment.responses.map((resp) => (
              <div
                key={resp.id}
                className="glass-card rounded-3xl p-5 border border-slate-900 flex flex-col sm:flex-row gap-4 justify-between items-start"
              >
                <div className="space-y-2 overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-violet-400">{resp.criterion.code}</span>
                    <span className="text-xs font-medium text-slate-400 truncate">{resp.criterion.component.domain.name} / {resp.criterion.component.name}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{resp.criterion.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-950/30 p-3 rounded-xl border border-slate-900/60 mt-2">
                    &ldquo;{resp.justification || 'No justification provided.'}&rdquo;
                  </p>

                  {/* Evidence Files */}
                  {resp.evidenceFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {resp.evidenceFiles.map((file) => (
                        <a
                          key={file.id}
                          href={`http://localhost:3001${file.storageUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 text-violet-400" />
                          {file.fileTitle || file.fileName}
                          <Download className="h-3 w-3 text-slate-500" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score badge */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/50 border border-slate-900 text-center shrink-0 w-full sm:w-20 self-stretch sm:self-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Score</span>
                  <span className="text-xl font-extrabold text-violet-400 block mt-0.5">
                    {resp.score !== null ? resp.score : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Review Comments and actions */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Index summary card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-900 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl -z-10"></div>
            
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Overall Index</span>
            <div className="text-4xl font-black bg-gradient-to-r from-violet-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent mt-1 block">
              {Number(assessment.chpmiScore).toFixed(2)}%
            </div>
            <div className="inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-bold text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              {assessment.maturityBand?.label || 'Calculating...'}
            </div>
          </div>

          {/* Action Comments entry for Reviewer */}
          {isReviewActive && (
            <div className="glass-card rounded-3xl p-6 border border-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="h-4.5 w-4.5 text-violet-400" />
                Review Decision
              </h3>

              <div>
                <label htmlFor="reviewComment" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Review Comment / Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="reviewComment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Insert detailed review notes. If requesting revisions, list specific criteria codes and requested corrections..."
                  className="glass-input p-3 rounded-2xl w-full text-xs block resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleRevision}
                  disabled={revisionMutation.isPending || approveMutation.isPending}
                  className="py-3 px-4 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {revisionMutation.isPending ? 'Processing...' : 'Request Revision'}
                </button>
                
                <button
                  onClick={handleApprove}
                  disabled={revisionMutation.isPending || approveMutation.isPending}
                  className="py-3 px-4 rounded-xl text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {approveMutation.isPending ? 'Processing...' : 'Approve Index'}
                </button>
              </div>
            </div>
          )}

          {/* Review Comments History */}
          <div className="glass-card rounded-3xl p-6 border border-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Review History</h3>
            
            {assessment.reviewComments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No previous comments or review history found.</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {assessment.reviewComments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 rounded-2xl bg-slate-900/40 border border-slate-900 space-y-1.5 text-xs"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-300">{comm.commentedBy.fullName}</span>
                      <span className="text-slate-500">{new Date(comm.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                      comm.commentType === 'approval_note'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {comm.commentType.replace('_', ' ')}
                    </span>
                    <p className="text-slate-400 mt-1 leading-relaxed italic">
                      &ldquo;{comm.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
