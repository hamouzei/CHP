'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../../services/api';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Shield,
} from 'lucide-react';

const MATURITY_COLORS: Record<string, string> = {
  'Non-Existent': '#ef4444',
  'Nascent': '#f97316',
  'Emerging': '#eab308',
  'Developing': '#22c55e',
  'Established': '#06b6d4',
  'Matured': '#8b5cf6',
};

export default function AssessmentReportPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);

  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/assessments/${id}`),
    enabled: !!id && !!user,
  });

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setPdfSuccess(false);
    try {
      const response = await api.post(`/assessments/${id}/reports/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CHP_Maturity_Report_${assessment?.cycleName || id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    setExcelSuccess(false);
    try {
      const response = await api.post(`/assessments/${id}/reports/excel`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CHP_Maturity_Matrix_${assessment?.cycleName || id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExcelSuccess(true);
      setTimeout(() => setExcelSuccess(false), 3000);
    } catch (err: any) {
      console.error('Excel export error:', err);
      alert('Failed to generate Excel report. Please try again.');
    } finally {
      setExportingExcel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-sm text-slate-400">Loading report options...</span>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-3xl p-8 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-300 font-medium">{(error as any)?.message || 'Assessment not found'}</p>
          <Link
            href="/assessments"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-300 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const chpmi = assessment.chpmiScore ? Number(assessment.chpmiScore) : 0;
  const bandLabel = assessment.maturityBand?.label || 'Non-Existent';
  const bandColor = MATURITY_COLORS[bandLabel] || '#64748b';
  const scoredCount = assessment.responses?.filter((r: any) => r.score !== null).length || 0;
  const totalCount = assessment.responses?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/assessments" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Assessments
        </Link>
        <span className="text-slate-700">/</span>
        <Link href={`/assessments/${id}`} className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
          {assessment.cycleName}
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-xs font-bold text-slate-300">Reports</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl -z-10" />
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Assessment Reports
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Download formatted reports for <span className="font-semibold text-slate-300">{assessment.cycleName}</span>
        </p>

        {/* Score Summary */}
        <div className="flex items-center gap-6 mt-5 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/40">
          <div>
            <div className="text-3xl font-black text-white">{chpmi.toFixed(1)}<span className="text-lg text-slate-500">%</span></div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CHPMI</div>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase border"
              style={{ color: bandColor, borderColor: `${bandColor}30`, backgroundColor: `${bandColor}10` }}
            >
              <Sparkles className="h-3 w-3" />
              {bandLabel}
            </span>
            <div className="text-[10px] text-slate-500 mt-1">Maturity Band</div>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div>
            <div className="text-lg font-bold text-white">{scoredCount}<span className="text-sm text-slate-500">/{totalCount}</span></div>
            <div className="text-[10px] text-slate-500">Criteria Scored</div>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* PDF Report */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-600/10 rounded-xl border border-red-500/20">
              <FileText className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">PDF Report</h3>
              <p className="text-[10px] text-slate-500">Full assessment report with scores and charts</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Generate a comprehensive PDF report including organization details, all 30 criteria scores with justifications, component and domain summaries, maturity band classification, and visual charts.
          </p>
          {pdfSuccess && (
            <div className="mb-3 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> PDF downloaded successfully
            </div>
          )}
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-red-300 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {exportingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download PDF Report
              </>
            )}
          </button>
        </div>

        {/* Excel Report */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-600/10 rounded-xl border border-emerald-500/20">
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Excel Export</h3>
              <p className="text-[10px] text-slate-500">Structured data in spreadsheet format</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Export the full scoring matrix as an Excel workbook with separate sheets for criteria scores, component summaries, domain scores, and overall CHPMI calculation. Ideal for further analysis.
          </p>
          {excelSuccess && (
            <div className="mb-3 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Excel downloaded successfully
            </div>
          )}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-emerald-300 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {exportingExcel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating Excel...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download Excel Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
