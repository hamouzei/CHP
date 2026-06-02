'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import {
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileEdit,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  Eye,
  Loader2,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface Assessment {
  id: string;
  cycleName: string;
  assessmentPeriod: string | null;
  assessmentType: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'approved' | 'revision_requested' | 'archived';
  chpmiScore: number;
  createdAt: string;
  organization: {
    name: string;
  };
  assignedAssessor: {
    fullName: string;
  } | null;
  assignedReviewer: {
    fullName: string;
  } | null;
  maturityBand: {
    label: string;
  } | null;
}

export default function AssessmentsListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: assessments = [], isLoading, error } = useQuery<Assessment[]>({
    queryKey: ['assessments'],
    queryFn: () => api.get('/assessments'),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300';
      case 'under_review':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300';
      case 'revision_requested':
        return 'bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/30 text-rose-300';
      case 'in_progress':
        return 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/30 text-sky-300';
      case 'draft':
        return 'bg-slate-800/80 border border-slate-700/80 text-slate-300';
      default:
        return 'bg-slate-800/80 border border-slate-700/80 text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'under_review':
        return <Clock className="h-3.5 w-3.5" />;
      case 'revision_requested':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'in_progress':
        return <FileEdit className="h-3.5 w-3.5" />;
      default:
        return <FolderOpen className="h-3.5 w-3.5" />;
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch = a.cycleName.toLowerCase().includes(search.toLowerCase()) ||
      a.organization.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.assessmentPeriod && a.assessmentPeriod.toLowerCase().includes(search.toLowerCase()));
      
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canCreate = user?.role === 'admin' || user?.role === 'super_admin';
  const canDelete = user?.role === 'admin' || user?.role === 'super_admin';

  // Delete assessment mutation
  const deleteAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => api.delete(`/assessments/${assessmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeletingId(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete assessment.');
      setDeletingId(null);
    },
  });

  const handleDeleteAssessment = (assessmentId: string, cycleName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the assessment "${cycleName}"? This action cannot be undone.`)) {
      setDeletingId(assessmentId);
      deleteAssessmentMutation.mutate(assessmentId);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Assessments Manager
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Configure assessments, scoring frameworks, and workflows.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/assessments/new"
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all duration-300 active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            New Assessment
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-3xl glass-panel border-slate-900/60">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by cycle, period, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full block focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-4 py-2.5 rounded-2xl text-sm block cursor-pointer pr-8"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="under_review">Under Review</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-sm text-slate-400">Fetching assessments data...</span>
        </div>
      ) : error ? (
        <div className="glass-card rounded-3xl p-8 text-center border-red-500/20 text-red-400">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-200">Failed to Load Assessments</h3>
          <p className="text-xs text-slate-400 mt-1">An unexpected API error occurred: {(error as any).message}</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <FileSpreadsheet className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-200">No Assessments Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {search || statusFilter !== 'all'
              ? 'Try modifying your search or filter keywords to show matching records.'
              : 'Configure your first assessment lifecycle to begin recording maturity scores.'}
          </p>
          {canCreate && !search && statusFilter === 'all' && (
            <Link
              href="/assessments/new"
              className="inline-flex items-center gap-2 mt-6 py-2.5 px-4 rounded-xl text-xs font-bold text-blue-300 hover:text-blue-200 bg-blue-600/10 border border-blue-500/20 transition-all"
            >
              Get Started
              <Plus className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssessments.map((a) => (
            <div
              key={a.id}
              className="glass-card rounded-3xl p-6 relative overflow-hidden group border border-slate-900 hover:border-slate-800/80"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 overflow-hidden">
                  <h3 className="text-lg font-extrabold text-white group-hover:text-blue-300 transition-colors truncate">
                    {a.cycleName}
                  </h3>
                  <span className="block text-xs font-bold text-slate-400 truncate">
                    {a.organization.name}
                  </span>
                </div>
                
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${getStatusBadge(a.status)}`}>
                  {getStatusIcon(a.status)}
                  {a.status.replace('_', ' ')}
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-900/60 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Period: <strong className="text-slate-300 font-semibold">{a.assessmentPeriod || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Type: <strong className="text-slate-300 font-semibold capitalize">{a.assessmentType}</strong></span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <User className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">Assessor: <strong className="text-slate-300 font-semibold">{a.assignedAssessor?.fullName || 'Unassigned'}</strong></span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <User className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">Reviewer: <strong className="text-slate-300 font-semibold">{a.assignedReviewer?.fullName || 'Unassigned'}</strong></span>
                </div>
              </div>

              {/* Score Indicator */}
              <div className="mt-6 flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-slate-900/80">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Maturity Classification</span>
                  <span className="text-sm font-extrabold text-slate-200 mt-0.5 block">
                    {a.maturityBand?.label || 'Calculating...'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CHPMI Score</span>
                  <span className="text-base font-extrabold text-blue-400 mt-0.5 block">
                    {Number(a.chpmiScore).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between items-center gap-3.5">
                {/* Delete button */}
                <div>
                  {canDelete && (user?.role === 'super_admin' || a.status === 'draft' || a.status === 'in_progress') && (
                    <button
                      onClick={() => handleDeleteAssessment(a.id, a.cycleName)}
                      disabled={deletingId === a.id}
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-500/15 hover:border-red-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {deletingId === a.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex gap-3.5">
                {a.status === 'under_review' && (user?.role === 'reviewer' || user?.role === 'super_admin') ? (
                  <Link
                    href={`/assessments/${a.id}/review`}
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-600/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all active:scale-[0.98]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Review Assessment
                  </Link>
                ) : null}

                {/* Score Action based on active status */}
                {a.status !== 'approved' && a.status !== 'archived' && (user?.role === 'assessor' || user?.role === 'admin' || user?.role === 'super_admin') ? (
                  <Link
                    href={`/assessments/${a.id}/scoring`}
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-blue-300 hover:text-blue-200 bg-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 transition-all active:scale-[0.98]"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    Score Framework
                  </Link>
                ) : (
                  <Link
                    href={`/assessments/${a.id}/scoring`}
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-slate-200 bg-slate-900/60 border border-slate-800 transition-all active:scale-[0.98]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Scoring
                  </Link>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
