'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  Save,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Trash2,
  ChevronDown,
  Info,
  Clock,
  Sparkles,
  Download,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileTitle: string;
  fileType: string;
  fileSizeBytes: string;
  storageUrl: string;
}

interface CriterionLevel {
  level: number;
  label: string;
  description: string;
}

interface Criterion {
  id: string;
  code: string;
  name: string;
  componentId: string;
  component: {
    id: string;
    code: string;
    name: string;
    domainId: string;
    domain: {
      id: string;
      code: string;
      name: string;
    };
  };
  levels: CriterionLevel[];
}

interface ResponseData {
  id: string;
  criteriaId: string;
  score: number | null;
  justification: string;
  scoredAt: string | null;
  evidenceFiles: EvidenceFile[];
  criterion: Criterion;
}

interface ComputedScore {
  id: string;
  domainId: string;
  componentId: string;
  domainScorePct: string | null;
  componentScore: string | null;
  domain?: {
    id: string;
    code: string;
    name: string;
  };
  component?: {
    id: string;
    code: string;
    name: string;
  };
}

interface Assessment {
  id: string;
  cycleName: string;
  assessmentPeriod: string | null;
  assessmentType: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'approved' | 'revision_requested' | 'archived';
  chpmiScore: number;
  organizationId: string;
  organization: {
    name: string;
  };
  maturityBand: {
    label: string;
  } | null;
  responses: ResponseData[];
  computedScores: ComputedScore[];
  reviewComments: any[];
}

export default function AssessmentScoringWizard() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeDomain, setActiveDomain] = useState<string>('LG');
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saved' | 'saving' | 'unsaved'>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState<Record<string, boolean>>({});
  const [fileTitle, setFileTitle] = useState<Record<string, string>>({});

  // Fetch full assessment details
  const { data: assessment, isLoading, error, refetch } = useQuery<Assessment>({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/assessments/${id}`),
  });

  // Load justifications into local state when assessment loads
  useEffect(() => {
    if (assessment) {
      const initialJustifications: Record<string, string> = {};
      assessment.responses.forEach((resp) => {
        initialJustifications[resp.criteriaId] = resp.justification || '';
      });
      setJustifications(initialJustifications);
    }
  }, [assessment]);

  // Score save mutation
  const saveResponseMutation = useMutation({
    mutationFn: (variables: { criteriaId: string; score: number; justification: string }) =>
      api.post(`/assessments/${id}/responses`, variables),
    onSuccess: (data, variables) => {
      setSaveStatus((prev) => ({ ...prev, [variables.criteriaId]: 'saved' }));
      // Invalidate query to pull fresh computed scores
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
    },
    onError: (err, variables) => {
      setSaveStatus((prev) => ({ ...prev, [variables.criteriaId]: 'unsaved' }));
      setErrors((prev) => ({ ...prev, [variables.criteriaId]: 'Failed to auto-save score.' }));
    },
  });

  // Submit assessment mutation
  const submitMutation = useMutation({
    mutationFn: () => api.post(`/assessments/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      router.push('/assessments');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to submit assessment. Ensure all 30 criteria are fully scored and justified.');
    },
  });

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading maturity framework scoring wizard...</span>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center border-red-500/20 text-red-400 max-w-xl mx-auto mt-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-200">Failed to Load Framework</h3>
        <p className="text-xs text-slate-400 mt-1">{(error as any)?.message || 'Assessment records not found.'}</p>
        <Link href="/assessments" className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to List
        </Link>
      </div>
    );
  }

  const isReadOnly = assessment.status === 'approved' || assessment.status === 'archived' || user?.role === 'viewer';
  
  // Group responses by Domain -> Component -> Responses
  const domains: Record<string, { name: string; components: Record<string, { name: string; responses: ResponseData[] }> }> = {};

  assessment.responses.forEach((resp) => {
    const domainCode = resp.criterion.component.domain.code;
    const domainName = resp.criterion.component.domain.name;
    const componentCode = resp.criterion.component.code;
    const componentName = resp.criterion.component.name;

    if (!domains[domainCode]) {
      domains[domainCode] = { name: domainName, components: {} };
    }
    if (!domains[domainCode].components[componentCode]) {
      domains[domainCode].components[componentCode] = { name: componentName, responses: [] };
    }
    domains[domainCode].components[componentCode].responses.push(resp);
  });

  // Sort responses inside components by displayOrder/code
  Object.values(domains).forEach((d) => {
    Object.values(d.components).forEach((c) => {
      c.responses.sort((a, b) => a.criterion.code.localeCompare(b.criterion.code));
    });
  });

  const handleScoreChange = (criteriaId: string, score: number, levelDescription?: string) => {
    if (isReadOnly) return;
    let currentJustification = justifications[criteriaId] || '';
    
    // Auto-populate justification with the selected level descriptor if empty or too short
    if (levelDescription && currentJustification.trim().length < 20) {
      currentJustification = levelDescription;
      setJustifications((prev) => ({ ...prev, [criteriaId]: currentJustification }));
    }
    
    // Optimistic status update
    setSaveStatus((prev) => ({ ...prev, [criteriaId]: 'saving' }));
    setErrors((prev) => ({ ...prev, [criteriaId]: '' }));

    saveResponseMutation.mutate({
      criteriaId,
      score,
      justification: currentJustification,
    });
  };

  const handleJustificationBlur = (criteriaId: string, currentScore: number | null) => {
    if (isReadOnly) return;
    const currentJustification = justifications[criteriaId] || '';
    if (currentScore === null) return; // Do not save until score is set

    setSaveStatus((prev) => ({ ...prev, [criteriaId]: 'saving' }));
    
    saveResponseMutation.mutate({
      criteriaId,
      score: currentScore,
      justification: currentJustification,
    });
  };

  // Upload Evidence File
  const handleFileUpload = async (criteriaId: string, file: File) => {
    if (!file) return;
    setUploadingFile((prev) => ({ ...prev, [criteriaId]: true }));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', fileTitle[criteriaId] || file.name);

    try {
      await api.post(`/assessments/${id}/responses/${criteriaId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFileTitle((prev) => ({ ...prev, [criteriaId]: '' }));
      refetch();
    } catch (err: any) {
      alert(err.message || 'File upload failed.');
    } finally {
      setUploadingFile((prev) => ({ ...prev, [criteriaId]: false }));
    }
  };

  // Delete Evidence File
  const handleFileDelete = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this evidence file?')) {
      try {
        await api.delete(`/assessments/evidence/${fileId}`);
        refetch();
      } catch (err: any) {
        alert(err.message || 'Failed to delete file.');
      }
    }
  };

  // Scoring checklist progress
  const totalCriteria = assessment.responses.length;
  const completedCriteria = assessment.responses.filter((r) => r.score !== null && r.justification.trim() !== '').length;
  const progressPercent = (completedCriteria / totalCriteria) * 100;

  // Retrieve computed domain scores for display in the summary
  const getDomainScore = (domainCode: string) => {
    // domainScorePct is stored on the first component's ComputedScore row for each domain
    const scoreObj = assessment.computedScores.find(
      (s) => s.domain?.code === domainCode && s.domainScorePct !== null
    );
    return scoreObj?.domainScorePct ? Number(scoreObj.domainScorePct) : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      {/* Top Breadcrumb Header */}
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
            {assessment.cycleName}
          </h1>
          <p className="text-xs text-slate-400">
            Organization: <strong className="text-slate-300 font-semibold">{assessment.organization.name}</strong> • Period: <strong className="text-slate-300 font-semibold">{assessment.assessmentPeriod || 'N/A'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          {/* Export Buttons */}
          <button
            onClick={async () => {
              try {
                const r = await api.post(`/assessments/${id}/reports/pdf`);
                const blob = await r.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `CHP_Report_${id}.pdf`; a.click(); window.URL.revokeObjectURL(url);
              } catch { alert('PDF export failed'); }
            }}
            className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-2xl text-[11px] font-bold text-red-300 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 transition-all active:scale-[0.98]"
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
            className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-2xl text-[11px] font-bold text-emerald-300 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>

          {/* Submit Assessment Button for Assessor */}
          {!isReadOnly && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={completedCriteria < 30 || submitMutation.isPending}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4.5 w-4.5" />
              )}
              Submit for Review
            </button>
          )}
        </div>
      </div>

      {/* Main Scoring Grid (Wizard Panel + Live Index Panel) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: scoring framework tab sheets */}
        <div className="xl:col-span-8 space-y-6">
          {/* Domain Tabs List */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/40 border border-slate-900">
            {Object.entries(domains).map(([code, dom]) => {
              const isActive = activeDomain === code;
              return (
                <button
                  key={code}
                  onClick={() => setActiveDomain(code)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-sky-600/20 border border-blue-500/30 text-blue-300 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="mr-1">{code}</span>
                  <span className="opacity-80 font-medium hidden sm:inline">{dom.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Domain Component Lists */}
          <div className="space-y-8">
            {domains[activeDomain] && (
              <>
                {/* Category / Domain Header */}
                <div className="relative">
                  <div className="flex items-center gap-4 px-6 py-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-sky-950/40 border border-blue-500/15">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-sky-600/20 border border-blue-500/25 shrink-0">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400/70 block mb-0.5">Category</span>
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-blue-200 bg-clip-text text-transparent leading-snug">
                        {domains[activeDomain].name}
                      </h2>
                    </div>
                  </div>
                </div>

                {Object.entries(domains[activeDomain].components).map(([compCode, comp]) => (
                <div key={compCode} className="space-y-4">
                  {/* Component Header Banner */}
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/50 border-l-[3px] border-l-blue-500/40 border border-slate-900">
                    <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-400 shrink-0 font-extrabold text-xs tracking-wider">
                      {compCode}
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 block mb-0.5">Component</span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-200 leading-snug">{comp.name}</h3>
                    </div>
                  </div>

                  {/* Criteria Cards within Component */}
                  <div className="space-y-6">
                    {comp.responses.map((resp) => {
                      const cId = resp.criteriaId;
                      const status = saveStatus[cId];
                      const err = errors[cId];

                      return (
                        <div
                          key={cId}
                          className="glass-card rounded-3xl p-6 border border-slate-900 hover:border-slate-800/80 relative"
                        >
                          {/* Top indicator header — Key Criteria */}
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-[10px] text-blue-400 bg-blue-600/10 border border-blue-500/20 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{resp.criterion.code}</span>
                              <div>
                                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 block mb-0.5">Key Criteria</span>
                                <h4 className="text-xs sm:text-[13px] font-semibold text-slate-300 leading-snug">{resp.criterion.name}</h4>
                              </div>
                            </div>

                            {/* Auto save indicator */}
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 shrink-0">
                              {status === 'saving' && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                                  Saving...
                                </span>
                              )}
                              {status === 'saved' && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Saved
                                </span>
                              )}
                              {err && <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> {err}</span>}
                            </div>
                          </div>

                          {/* Criterion inline Level Descriptors list */}
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                            {resp.criterion.levels.map((levelObj) => {
                              const isSelected = resp.score === levelObj.level;
                              return (
                                <div key={levelObj.level} className="relative group/level">
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => handleScoreChange(cId, levelObj.level, levelObj.description)}
                                    className={`p-3.5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between h-full cursor-pointer min-h-[120px] w-full ${
                                      isSelected
                                        ? 'bg-gradient-to-br from-blue-600/30 to-sky-600/20 border-blue-500/50 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20'
                                        : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800/80 hover:bg-slate-900/60'
                                    } disabled:cursor-not-allowed`}
                                  >
                                    <div className="flex justify-between items-center w-full mb-2">
                                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                                        isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        Level {levelObj.level}
                                      </span>
                                    </div>
                                    <p className={`text-[11px] leading-relaxed line-clamp-4 ${
                                      isSelected ? 'text-slate-100 font-medium' : 'text-slate-400'
                                    }`}>
                                      {levelObj.description}
                                    </p>
                                  </button>
                                  {/* Hover tooltip showing full description */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-h-64 overflow-y-auto opacity-0 invisible group-hover/level:opacity-100 group-hover/level:visible transition-all duration-200 z-50 pointer-events-none group-hover/level:pointer-events-auto">
                                    <div className="bg-slate-900/98 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-4 shadow-2xl shadow-black/40">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                                          isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                          Level {levelObj.level}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">{levelObj.label}</span>
                                      </div>
                                      <p className={`text-[11px] leading-relaxed ${
                                        isSelected ? 'text-slate-100' : 'text-slate-300'
                                      }`}>
                                        {levelObj.description}
                                      </p>
                                    </div>
                                    <div className="w-3 h-3 bg-slate-900/98 border-b border-r border-slate-700/60 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Justification Box and Evidence Files split row */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-900/60">
                            
                            {/* Justification column */}
                            <div className="lg:col-span-7">
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                                Scoring Justification <span className="text-red-400">*</span>
                              </label>
                              <textarea
                                rows={3}
                                disabled={isReadOnly}
                                value={justifications[cId] ?? ''}
                                onChange={(e) => setJustifications({ ...justifications, [cId]: e.target.value })}
                                onBlur={() => handleJustificationBlur(cId, resp.score)}
                                placeholder="State specific MoH policies, regulatory structures, budgets, or operational audits supporting this level assignment..."
                                className="glass-input p-3 rounded-2xl w-full text-xs block resize-none leading-relaxed"
                              />
                            </div>

                            {/* Evidence files column */}
                            <div className="lg:col-span-5 flex flex-col justify-between">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                                  Evidence Collection
                                </label>

                                {/* List existing files */}
                                {resp.evidenceFiles.length > 0 ? (
                                  <div className="space-y-1.5 mb-3 max-h-[100px] overflow-y-auto pr-1">
                                    {resp.evidenceFiles.map((file) => (
                                      <div
                                        key={file.id}
                                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-900/80 text-[10px]"
                                      >
                                        <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                                          <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                          <span className="text-slate-300 font-medium truncate" title={file.fileName}>
                                            {file.fileTitle || file.fileName}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <a
                                            href={`http://localhost:3001${file.storageUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                                            title="Download File"
                                          >
                                            <Download className="h-3 w-3" />
                                          </a>
                                          {!isReadOnly && (
                                            <button
                                              type="button"
                                              onClick={() => handleFileDelete(file.id)}
                                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
                                              title="Delete File"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic mb-3">No files uploaded as evidence.</p>
                                )}
                              </div>

                              {/* Upload Form */}
                              {!isReadOnly && (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Brief document title (Optional)..."
                                    value={fileTitle[cId] || ''}
                                    onChange={(e) => setFileTitle({ ...fileTitle, [cId]: e.target.value })}
                                    className="glass-input px-3 py-1.5 rounded-xl text-[10px] w-full block"
                                  />
                                  <div className="relative">
                                    <input
                                      type="file"
                                      id={`file-upload-${cId}`}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(cId, file);
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`file-upload-${cId}`}
                                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-blue-600/5 text-[10px] font-bold text-blue-300 transition-all cursor-pointer w-full text-center"
                                    >
                                      {uploadingFile[cId] ? (
                                        <>
                                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                                          Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <UploadCloud className="h-3.5 w-3.5" />
                                          Upload PDF/Excel Evidence
                                        </>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Scoring Index summary panel */}
        <div className="xl:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-slate-900 sticky top-6 z-10">
            {/* Platform status banner */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Cycle Status</span>
                <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-extrabold capitalize text-blue-300">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  {assessment.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Scope</span>
                <span className="block mt-1 text-xs font-bold text-slate-300 capitalize">{assessment.assessmentType}</span>
              </div>
            </div>

            {/* Overall Score Gauge Display */}
            <div className="text-center py-6 bg-slate-900/20 rounded-3xl border border-slate-900/60 mb-6">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">CHPMI Score</span>
              <div className="text-4xl font-black bg-gradient-to-r from-blue-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent tracking-tight mt-1.5">
                {Number(assessment.chpmiScore).toFixed(2)}%
              </div>
              <div className="inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-xs font-bold text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                {assessment.maturityBand?.label || 'Calculating...'}
              </div>
            </div>

            {/* Checklist progress bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Criteria Scored:</span>
                <strong className="text-slate-200 font-bold">{completedCriteria} / {totalCriteria}</strong>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/50">
                <div
                  className="bg-gradient-to-r from-blue-600 to-sky-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Domain average scores */}
            <div className="space-y-3.5 border-t border-slate-900 pt-5">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Domain Averages:</h4>
              <div className="space-y-2.5">
                {Object.entries(domains).map(([code, dom]) => {
                  const score = getDomainScore(code);
                  return (
                    <div key={code} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-600/10 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                          {code}
                        </span>
                        <span className="text-slate-400 font-medium truncate">{dom.name}</span>
                      </div>
                      <span className="font-extrabold text-slate-200 text-right shrink-0">
                        {score.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning if incomplete */}
            {completedCriteria < 30 && !isReadOnly && (
              <div className="mt-6 flex items-start gap-2.5 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/10 text-[10px] text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>You must assign a score (0-4) and add a justification for all 30 framework criteria before submitting the assessment.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
