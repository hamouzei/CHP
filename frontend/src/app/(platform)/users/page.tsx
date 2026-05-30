'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Building2,
  Search,
  Filter,
  Loader2,
  UserCheck,
  ShieldAlert,
  Power,
  Edit2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  User,
  Lock,
  Globe,
  MapPin,
  Building
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  organizationId: string | null;
  organizationName: string | null;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  countryCode: string | null;
  region: string | null;
  organizationType: 'national' | 'subnational' | 'partner';
  isActive: boolean;
  createdAt: string;
}

export default function UserDirectoryPage() {
  const { user: currentUser, startImpersonation } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Navigation / Tabs
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'users' | 'organizations'>(isSuperAdmin ? 'users' : 'users');

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [orgSearch, setOrgSearch] = useState('');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // Invite Form state
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'assessor',
    organizationId: currentUser?.organizationId || '',
  });
  const [inviteError, setInviteError] = useState('');

  // Org Form state
  const [orgForm, setOrgForm] = useState({
    name: '',
    organizationType: 'national' as 'national' | 'subnational' | 'partner',
    countryCode: '',
    region: '',
  });
  const [orgError, setOrgError] = useState('');

  // Queries
  const { data: users = [], isLoading: isUsersLoading, error: usersError } = useQuery<UserItem[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
  });

  const { data: organizations = [], isLoading: isOrgsLoading, error: orgsError } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: () => api.get('/organizations'),
    enabled: isSuperAdmin,
  });

  // Mutations
  const inviteUserMutation = useMutation({
    mutationFn: (data: typeof inviteForm) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsInviteModalOpen(false);
      setInviteForm({
        fullName: '',
        email: '',
        password: '',
        role: 'assessor',
        organizationId: currentUser?.organizationId || '',
      });
      setInviteError('');
    },
    onError: (err: any) => {
      setInviteError(err.message || 'Failed to invite user');
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: typeof orgForm) => api.post('/organizations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsOrgModalOpen(false);
      setOrgForm({ name: '', organizationType: 'national', countryCode: '', region: '' });
      setOrgError('');
    },
    onError: (err: any) => {
      setOrgError(err.message || 'Failed to create organization');
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsOrgModalOpen(false);
      setEditingOrg(null);
      setOrgForm({ name: '', organizationType: 'national', countryCode: '', region: '' });
      setOrgError('');
    },
    onError: (err: any) => {
      setOrgError(err.message || 'Failed to update organization');
    },
  });

  const changeUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to change user role');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/users/${userId}/impersonate`),
    onSuccess: (data) => {
      if (data.accessToken && data.user) {
        startImpersonation(data.user, data.accessToken);
        router.push('/dashboard');
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Impersonation failed');
    },
  });

  // Handle forms submit
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.fullName || !inviteForm.email || !inviteForm.password || !inviteForm.organizationId) {
      setInviteError('All fields are required.');
      return;
    }
    inviteUserMutation.mutate(inviteForm);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name) {
      setOrgError('Organization Name is required.');
      return;
    }
    if (orgForm.countryCode && orgForm.countryCode.length !== 3) {
      setOrgError('ISO Country Code must be exactly 3 characters.');
      return;
    }

    if (editingOrg) {
      updateOrgMutation.mutate({ id: editingOrg.id, data: orgForm });
    } else {
      createOrgMutation.mutate(orgForm);
    }
  };

  const openEditOrgModal = (org: Organization) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      organizationType: org.organizationType,
      countryCode: org.countryCode || '',
      region: org.region || '',
    });
    setIsOrgModalOpen(true);
  };

  // Helper styles/labels
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300';
      case 'admin':
        return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300';
      case 'assessor':
        return 'bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-300';
      case 'reviewer':
        return 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300';
      default:
        return 'bg-slate-800/80 border border-slate-700/80 text-slate-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'assessor': return 'Assessor';
      case 'reviewer': return 'Reviewer';
      default: return 'Viewer';
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.organizationName && u.organizationName.toLowerCase().includes(userSearch.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesOrg = orgFilter === 'all' || u.organizationId === orgFilter;

    return matchesSearch && matchesRole && matchesOrg;
  });

  // Filter orgs
  const filteredOrgs = organizations.filter((o) => {
    return o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
      (o.region && o.region.toLowerCase().includes(orgSearch.toLowerCase())) ||
      (o.countryCode && o.countryCode.toLowerCase().includes(orgSearch.toLowerCase()));
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            User Directory
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            {isSuperAdmin
              ? 'Manage platform users, coordinate organizations, assign roles, and support sessions.'
              : 'View and invite users within your organization.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 transition-all duration-300 active:scale-[0.98]"
          >
            <UserPlus className="h-4.5 w-4.5" />
            Invite New User
          </button>

          {isSuperAdmin && activeTab === 'organizations' && (
            <button
              onClick={() => {
                setEditingOrg(null);
                setOrgForm({ name: '', organizationType: 'national', countryCode: '', region: '' });
                setIsOrgModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/25 transition-all duration-300 active:scale-[0.98]"
            >
              <Plus className="h-4.5 w-4.5" />
              New Organization
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="flex border-b border-slate-900/60 gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'organizations'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4.5 w-4.5" />
            Organizations
          </button>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 p-4 rounded-3xl glass-panel border-slate-900/60">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full block focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="glass-input px-4 py-2.5 rounded-2xl text-sm block cursor-pointer pr-8"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="assessor">Assessor</option>
                <option value="reviewer">Reviewer</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {/* Org Filter (Super Admin Only) */}
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                  className="glass-input px-4 py-2.5 rounded-2xl text-sm block cursor-pointer pr-8 max-w-[200px]"
                >
                  <option value="all">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* User List Panel */}
          {isUsersLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
              <span className="text-sm text-slate-400">Fetching users list...</span>
            </div>
          ) : usersError ? (
            <div className="glass-card rounded-3xl p-8 text-center border-red-500/20 text-red-400">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-200">Failed to Load Users</h3>
              <p className="text-xs text-slate-400 mt-1">{(usersError as any).message}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-200">No Users Found</h3>
              <p className="text-sm text-slate-400 mt-1">Try modifying your search query or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl glass-panel border-slate-900/60">
              <table className="min-w-full divide-y divide-slate-900/60 text-sm">
                <thead className="bg-slate-950/40 text-slate-400 font-bold">
                  <tr>
                    <th scope="col" className="px-6 py-4.5 text-left tracking-wide">Name & Email</th>
                    {isSuperAdmin && <th scope="col" className="px-6 py-4.5 text-left tracking-wide">Organization</th>}
                    <th scope="col" className="px-6 py-4.5 text-left tracking-wide">Role</th>
                    <th scope="col" className="px-6 py-4.5 text-left tracking-wide">Status</th>
                    {isSuperAdmin && <th scope="col" className="px-6 py-4.5 text-right tracking-wide">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/10 transition-colors">
                      {/* Name / Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-400 font-bold border border-violet-500/10 shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-200">{u.fullName}</span>
                            <span className="block text-xs text-slate-400 mt-0.5">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Org */}
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-slate-300 font-semibold">
                          {u.organizationName || 'No Organization'}
                        </td>
                      )}

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Actions */}
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {/* Impersonate */}
                            {u.id !== currentUser?.id && u.isActive ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Start user impersonation session for ${u.fullName}?`)) {
                                    impersonateMutation.mutate(u.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all active:scale-[0.98]"
                                title="Impersonate User"
                              >
                                <UserCheck className="h-3 w-3" />
                                Impersonate
                              </button>
                            ) : null}

                            {/* Role Select Prompter */}
                            {u.id !== currentUser?.id ? (
                              <select
                                value={u.role}
                                onChange={(e) => changeUserRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 cursor-pointer focus:ring-1 focus:ring-violet-500 shrink-0 font-semibold"
                              >
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="assessor">Assessor</option>
                                <option value="reviewer">Reviewer</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            ) : null}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Organizations */}
      {isSuperAdmin && activeTab === 'organizations' && (
        <div className="space-y-6">
          {/* Org Search Bar */}
          <div className="flex gap-4 p-4 rounded-3xl glass-panel border-slate-900/60">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search organizations by name, region, country..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full block focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Org List Table */}
          {isOrgsLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
              <span className="text-sm text-slate-400">Fetching organizations list...</span>
            </div>
          ) : orgsError ? (
            <div className="glass-card rounded-3xl p-8 text-center border-red-500/20 text-red-400">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-200">Failed to Load Organizations</h3>
              <p className="text-xs text-slate-400 mt-1">{(orgsError as any).message}</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-200">No Organizations Found</h3>
              <p className="text-sm text-slate-400 mt-1">Create your first organization above to begin assessments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl glass-panel border-slate-900/60">
              <table className="min-w-full divide-y divide-slate-900/60 text-sm">
                <thead className="bg-slate-950/40 text-slate-400 font-bold">
                  <tr>
                    <th scope="col" className="px-6 py-4.5 text-left tracking-wide">Organization Name</th>
                    <th scope="col" className="px-6 py-4.5 text-left tracking-wide">Type</th>
                    <th scope="col" className="px-6 py-4.5 text-left tracking-wide">ISO Code / Region</th>
                    <th scope="col" className="px-6 py-4.5 text-left tracking-wide">Status</th>
                    <th scope="col" className="px-6 py-4.5 text-right tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-900/10 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-slate-200">
                        {org.name}
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 capitalize font-semibold text-slate-400">
                        {org.organizationType}
                      </td>

                      {/* Code / Region */}
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex flex-col">
                          <span>Country ISO: <strong className="text-slate-100 font-semibold">{org.countryCode || 'N/A'}</strong></span>
                          <span className="text-xs text-slate-400 mt-0.5">Region: {org.region || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${org.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${org.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                          {org.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2.5 items-center">
                          {/* Edit Details */}
                          <button
                            onClick={() => openEditOrgModal(org)}
                            className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-extrabold uppercase tracking-wide text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>

                          {/* Suspension toggle */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to ${org.isActive ? 'suspend' : 'activate'} ${org.name}?`)) {
                                updateOrgMutation.mutate({ id: org.id, data: { isActive: !org.isActive } });
                              }
                            }}
                            className={`inline-flex items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border transition-all ${
                              org.isActive
                                ? 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border-red-500/20'
                                : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
                            }`}
                          >
                            <Power className="h-3 w-3" />
                            {org.isActive ? 'Suspend' : 'Activate'}
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
      )}

      {/* --- INVITE USER MODAL --- */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 sm:p-8 border border-slate-900 shadow-2xl relative">
            <button
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteError('');
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <UserPlus className="h-5.5 w-5.5 text-violet-400" />
              Invite New User
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Add user metadata and issue system authentication access credentials.
            </p>

            <form onSubmit={handleInviteSubmit} className="mt-6 space-y-4">
              {inviteError && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
                  <span>{inviteError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name..."
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                    className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@organization.org"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Default Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Must meet strength guidelines (10+ chars)"
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                    className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Scope/Organization Selector */}
              {isSuperAdmin ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Assigned Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <select
                      required
                      value={inviteForm.organizationId}
                      onChange={(e) => setInviteForm({ ...inviteForm, organizationId: e.target.value })}
                      className="glass-input pl-10 pr-8 py-2.5 rounded-2xl text-sm w-full block cursor-pointer pr-10"
                    >
                      <option value="">Select Organization...</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">System Role</label>
                <select
                  required
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="glass-input px-4 py-2.5 rounded-2xl text-sm w-full block cursor-pointer pr-8"
                >
                  <option value="admin">Admin</option>
                  <option value="assessor">Assessor</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setInviteError('');
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteUserMutation.isPending}
                  className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {inviteUserMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Invite User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT ORGANIZATION MODAL --- */}
      {isSuperAdmin && isOrgModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 sm:p-8 border border-slate-900 shadow-2xl relative">
            <button
              onClick={() => {
                setIsOrgModalOpen(false);
                setEditingOrg(null);
                setOrgError('');
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Building2 className="h-5.5 w-5.5 text-cyan-400" />
              {editingOrg ? 'Edit Organization' : 'Create Organization'}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Define organization properties, metadata scopes, and structure types.
            </p>

            <form onSubmit={handleOrgSubmit} className="mt-6 space-y-4">
              {orgError && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
                  <span>{orgError}</span>
                </div>
              )}

              {/* Organization Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Organization Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenya Ministry of Health"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Organization Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Scope Type</label>
                <select
                  required
                  value={orgForm.organizationType}
                  onChange={(e) => setOrgForm({ ...orgForm, organizationType: e.target.value as any })}
                  className="glass-input px-4 py-2.5 rounded-2xl text-sm w-full block cursor-pointer pr-8"
                >
                  <option value="national">National</option>
                  <option value="subnational">Sub-national</option>
                  <option value="partner">Partner</option>
                </select>
              </div>

              {/* Country ISO Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Country ISO Code (3-letter)</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. KEN, ETH, RWA"
                    maxLength={3}
                    value={orgForm.countryCode}
                    onChange={(e) => setOrgForm({ ...orgForm, countryCode: e.target.value.toUpperCase() })}
                    className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Region */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Region / Province</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Sub-Saharan Africa, Nairobi"
                    value={orgForm.region}
                    onChange={(e) => setOrgForm({ ...orgForm, region: e.target.value })}
                    className="glass-input pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsOrgModalOpen(false);
                    setEditingOrg(null);
                    setOrgError('');
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrgMutation.isPending || updateOrgMutation.isPending}
                  className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {(createOrgMutation.isPending || updateOrgMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingOrg ? 'Save Changes' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
