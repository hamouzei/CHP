'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Shield, ArrowLeft, Loader2, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

interface UserOption {
  id: string;
  fullName: string;
  role: string;
  email: string;
}

interface OrgOption {
  id: string;
  name: string;
  organizationType: string;
}

export default function NewAssessmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [cycleName, setCycleName] = useState('');
  const [assessmentPeriod, setAssessmentPeriod] = useState('');
  const [assessmentType, setAssessmentType] = useState('national');
  const [assignedAssessorId, setAssignedAssessorId] = useState('');
  const [assignedReviewerId, setAssignedReviewerId] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch users of the organization (or all users for super_admin)
  const { data: users = [], isLoading: loadingUsers } = useQuery<UserOption[]>({
    queryKey: ['users-options'],
    queryFn: () => api.get('/users'),
  });

  // Fetch organizations (super_admin only)
  const { data: organizations = [], isLoading: loadingOrgs } = useQuery<OrgOption[]>({
    queryKey: ['orgs-options'],
    queryFn: () => api.get('/organizations'),
    enabled: currentUser?.role === 'super_admin',
  });

  const assessors = users.filter((u) => u.role === 'assessor' || u.role === 'admin' || u.role === 'super_admin');
  const reviewers = users.filter((u) => u.role === 'reviewer' || u.role === 'admin' || u.role === 'super_admin');

  const createMutation = useMutation({
    mutationFn: (newAssessment: any) => api.post('/assessments', newAssessment),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      router.push(`/assessments/${data.id}/scoring`);
    },
    onError: (err: any) => {
      setError(err.message || 'An unexpected error occurred while creating the assessment.');
    },
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!cycleName.trim()) {
      errors.cycleName = 'Cycle Name is required';
    } else if (cycleName.length < 3) {
      errors.cycleName = 'Cycle Name must be at least 3 characters';
    }

    if (currentUser?.role === 'super_admin' && !selectedOrgId) {
      errors.organization = 'Target organization is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) return;

    const payload: any = {
      cycleName,
      assessmentPeriod: assessmentPeriod || undefined,
      assessmentType,
      assignedAssessorId: assignedAssessorId || undefined,
      assignedReviewerId: assignedReviewerId || undefined,
    };

    if (currentUser?.role === 'super_admin') {
      payload.organizationId = selectedOrgId;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link
        href="/assessments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assessments
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          New Assessment Cycle
        </h1>
        <p className="mt-1 text-white/50 text-sm">
          Initialize a new maturity assessment cycle for community health program reviews.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Selection (Super Admin only) */}
          {currentUser?.role === 'super_admin' && (
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Target Organization <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className={`glass-input px-4 py-3 rounded-2xl text-sm block w-full cursor-pointer pr-10 ${
                  validationErrors.organization ? 'border-red-500/40 focus:border-red-500' : ''
                }`}
              >
                <option value="">Select Target Organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.organizationType})
                  </option>
                ))}
              </select>
              {validationErrors.organization && (
                <p className="mt-1.5 text-xs text-red-400">{validationErrors.organization}</p>
              )}
            </div>
          )}

          {/* Cycle Name */}
          <div>
            <label htmlFor="cycleName" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Cycle Name <span className="text-red-400">*</span>
            </label>
            <input
              id="cycleName"
              type="text"
              required
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              className={`glass-input px-4 py-3 rounded-2xl text-sm block w-full ${
                validationErrors.cycleName ? 'border-red-500/40 focus:border-red-500' : ''
              }`}
              placeholder="e.g. National Community Health Assessment 2026"
            />
            {validationErrors.cycleName && (
              <p className="mt-1.5 text-xs text-red-400">{validationErrors.cycleName}</p>
            )}
          </div>

          {/* Assessment Period & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="assessmentPeriod" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Assessment Period
              </label>
              <input
                id="assessmentPeriod"
                type="text"
                value={assessmentPeriod}
                onChange={(e) => setAssessmentPeriod(e.target.value)}
                className="glass-input px-4 py-3 rounded-2xl text-sm block w-full"
                placeholder="e.g. FY26 Q4, or Annual 2026"
              />
            </div>

            <div>
              <label htmlFor="assessmentType" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Assessment Type
              </label>
              <select
                id="assessmentType"
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="glass-input px-4 py-3 rounded-2xl text-sm block w-full cursor-pointer pr-10"
              >
                <option value="national">National</option>
                <option value="subnational">Subnational</option>
                <option value="partner">Partner Review</option>
              </select>
            </div>
          </div>

          {/* User Assignments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="assignedAssessor" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Assigned Assessor
              </label>
              <select
                id="assignedAssessor"
                value={assignedAssessorId}
                onChange={(e) => setAssignedAssessorId(e.target.value)}
                className="glass-input px-4 py-3 rounded-2xl text-sm block w-full cursor-pointer pr-10"
                disabled={loadingUsers}
              >
                <option value="">Choose Assessor (Optional)...</option>
                {assessors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assignedReviewer" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Assigned Reviewer
              </label>
              <select
                id="assignedReviewer"
                value={assignedReviewerId}
                onChange={(e) => setAssignedReviewerId(e.target.value)}
                className="glass-input px-4 py-3 rounded-2xl text-sm block w-full cursor-pointer pr-10"
                disabled={loadingUsers}
              >
                <option value="">Choose Reviewer (Optional)...</option>
                {reviewers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-white/08 flex justify-end gap-4">
            <Link
              href="/assessments"
              className="py-3.5 px-6 rounded-2xl text-xs font-bold text-white/50 hover:text-white bg-[#003366]/60 border border-white/10 transition-colors active:scale-[0.98]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex justify-center items-center gap-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#0072BC] to-[#0072BC]/80 hover:from-[#005a94] hover:to-[#0072BC] shadow-lg shadow-[#0072BC]/15 hover:shadow-[#0072BC]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Initializing cycle...
                </>
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5" />
                  Create Assessment Cycle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
