'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Globe,
  MapPin,
  Shield,
  Search,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  countryCode: string | null;
  region: string | null;
  organizationType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrgFormData {
  name: string;
  countryCode: string;
  region: string;
  organizationType: string;
}

const ORG_TYPES = [
  { value: 'national', label: 'National' },
  { value: 'subnational', label: 'Subnational' },
  { value: 'partner', label: 'Partner' },
];

export default function OrganizationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<OrgFormData>({ name: '', countryCode: '', region: '', organizationType: 'national' });
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Guard: only super_admin
  React.useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.replace('/assessments');
    }
  }, [user, router]);

  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: () => api.get('/organizations'),
    enabled: user?.role === 'super_admin',
  });

  const createMutation = useMutation({
    mutationFn: (data: OrgFormData) => api.post('/organizations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      closeModal();
      setSuccessMsg('Organization created successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => setFormError(err.message || 'Failed to create organization'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrgFormData & { isActive: boolean }> }) =>
      api.patch(`/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      closeModal();
      setSuccessMsg('Organization updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => setFormError(err.message || 'Failed to update organization'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setDeleteConfirm(null);
      setSuccessMsg('Organization deleted successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setDeleteConfirm(null);
      setFormError(err.message || 'Failed to delete organization');
      setTimeout(() => setFormError(null), 4000);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingOrg(null);
    setFormData({ name: '', countryCode: '', region: '', organizationType: 'national' });
    setFormError(null);
  };

  const openCreateModal = () => {
    setFormData({ name: '', countryCode: '', region: '', organizationType: 'national' });
    setEditingOrg(null);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (org: Organization) => {
    setFormData({
      name: org.name,
      countryCode: org.countryCode || '',
      region: org.region || '',
      organizationType: org.organizationType || 'national',
    });
    setEditingOrg(org);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.name.length < 2) {
      setFormError('Organization name must be at least 2 characters');
      return;
    }
    if (formData.countryCode && formData.countryCode.length !== 3) {
      setFormError('Country code must be exactly 3 characters (ISO 3166-1 alpha-3)');
      return;
    }

    const payload = {
      name: formData.name,
      ...(formData.countryCode ? { countryCode: formData.countryCode.toUpperCase() } : {}),
      ...(formData.region ? { region: formData.region } : {}),
      organizationType: formData.organizationType,
    };

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data: payload });
    } else {
      createMutation.mutate(payload as OrgFormData);
    }
  };

  const handleToggleActive = (org: Organization) => {
    updateMutation.mutate({ id: org.id, data: { isActive: !org.isActive } });
  };

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.countryCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.region || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!user || user.role !== 'super_admin') return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl -z-10" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-300 mb-3">
              <Shield className="h-3.5 w-3.5" />
              Super Admin
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Organizations
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Manage platform organizations — create, edit, suspend, or remove.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#0072BC] to-[#0072BC]/80 hover:from-[#005a94] hover:to-[#0072BC] shadow-lg shadow-[#0072BC]/15 hover:shadow-[#0072BC]/25 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Organization
          </button>
        </div>
      </div>

      {/* Success/Error Banners */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-sm animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {formError && !showModal && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Search + Table */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        {/* Search Bar */}
        <div className="mb-5">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..."
              className="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-[#0072BC] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">
              {search ? 'No organizations match your search.' : 'No organizations yet. Create one to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/08">
                  <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Name</th>
                  <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Country</th>
                  <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Region</th>
                  <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Type</th>
                  <th className="text-center py-2.5 px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</th>
                  <th className="text-right py-2.5 px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Created</th>
                  <th className="text-center py-2.5 px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.id} className="border-b border-white/05 hover:bg-[#003366]/20 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />
                        {org.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white/50">
                      {org.countryCode ? (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {org.countryCode}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-white/50">
                      {org.region ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {org.region}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#0072BC]/10 border border-[#0072BC]/25 text-[#0072BC]/80">
                        {org.organizationType || 'national'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleActive(org)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                          org.isActive
                            ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-600/20'
                            : 'bg-red-600/10 border border-red-500/20 text-red-300 hover:bg-red-600/20'
                        }`}
                        title={org.isActive ? 'Click to suspend' : 'Click to activate'}
                      >
                        {org.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right text-white/50">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openEditModal(org)}
                          className="p-1.5 rounded-lg text-[#0072BC] hover:bg-blue-950/30 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(org.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-3xl p-8 max-w-sm w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-red-600/10 rounded-2xl border border-red-500/20 mb-4">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Organization?</h3>
              <p className="text-sm text-white/50 mb-6">
                This will permanently delete the organization and all associated data. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="py-2.5 px-5 rounded-2xl text-xs font-bold text-white/70 bg-white/08 border border-white/10/40 hover:bg-[#003366]/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all disabled:opacity-50"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="glass-card rounded-3xl p-8 max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            <button onClick={closeModal} className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">
              {editingOrg ? 'Edit Organization' : 'Create Organization'}
            </h3>

            {formError && (
              <div className="mb-5 flex items-start gap-3 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="glass-input px-4 py-2.5 rounded-xl w-full text-sm"
                  placeholder="e.g. Ministry of Health — Kenya"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                    Country Code (ISO)
                  </label>
                  <input
                    type="text"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase().slice(0, 3) })}
                    className="glass-input px-4 py-2.5 rounded-xl w-full text-sm"
                    placeholder="KEN"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                    Region
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="glass-input px-4 py-2.5 rounded-xl w-full text-sm"
                    placeholder="East Africa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                  Organization Type
                </label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                  className="glass-input px-4 py-2.5 rounded-xl w-full text-sm"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#003366]">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2.5 px-5 rounded-2xl text-xs font-bold text-white/70 bg-white/08 border border-white/10/40 hover:bg-[#003366]/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#0072BC] to-[#0072BC]/80 hover:from-[#005a94] hover:to-[#0072BC] transition-all disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingOrg ? (
                    'Save Changes'
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
