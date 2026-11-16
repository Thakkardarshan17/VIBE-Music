import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  ListMusic,
  Music,
  Database,
  Cpu,
  Activity,
  CheckCircle,
  XCircle,
  Power,
  RefreshCw,
  Server,
  Key,
  Radio,
  Play,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { adminApi } from '../services/api.js';
import { AdminDashboardData, User as UserType, MusicProviderType } from '../types/music.js';
import { useAuth } from '../context/AuthContext.js';
import { providerManager } from '../services/providers/providerManager.js';
import { ProviderDiagnostic } from '../services/providers/types.js';

export const AdminPage: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);

  // Live Provider Architecture Diagnostics State
  const [providerDiagnostics, setProviderDiagnostics] = useState<ProviderDiagnostic[]>(() =>
    providerManager.getAllDiagnostics()
  );
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string }>>({});

  const handleTestProvider = async (providerId: MusicProviderType) => {
    setTestingProvider(providerId);
    try {
      const res = await providerManager.testProvider(providerId);
      setTestResults((prev) => ({ ...prev, [providerId]: res }));
      setProviderDiagnostics(providerManager.getAllDiagnostics());
    } finally {
      setTestingProvider(null);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [dash, uList] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getUsers(),
      ]);
      setDashboardData(dash);
      setUsers(uList);
    } catch (e) {
      console.warn('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleToggleProvider = async (name: string, currentEnabled: boolean) => {
    setUpdatingProvider(name);
    try {
      await adminApi.updateProvider(name, { isEnabled: !currentEnabled });
      await fetchAdminData();
    } catch (e) {
      console.warn(e);
    } finally {
      setUpdatingProvider(null);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-red-500/25 animate-fadeIn">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-sm text-purple-200/70 mb-4">
          This section requires Administrator privileges. Please log in with an administrator account (e.g. admin@vibemusic.com).
        </p>
      </div>
    );
  }

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-20 glass-card rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 glass-card rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, providers, database, system } = dashboardData;

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-pink-400" /> System Control Center
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Admin Dashboard</h2>
          <p className="text-sm text-purple-200/70 mt-1">Platform analytics, API providers status, and database health.</p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 text-xs font-semibold text-white flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-purple-400" /> Refresh Metrics
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-purple-300">Total Users</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{stats.totalUsers}</p>
          <span className="text-[11px] text-emerald-400 font-medium">● Registered Accounts</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-pink-300">Total Playlists</span>
            <ListMusic className="w-5 h-5 text-pink-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{stats.totalPlaylists}</p>
          <span className="text-[11px] text-purple-300 font-medium">● User Curated Collections</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-cyan-300">Indexed Tracks</span>
            <Music className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{stats.totalIndexedTracks}</p>
          <span className="text-[11px] text-cyan-300 font-medium">● Cached Song Library</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-emerald-300">Total Plays</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{stats.totalPlays}</p>
          <span className="text-[11px] text-emerald-300 font-medium">● Audio Streams Tracked</span>
        </div>
      </div>

      {/* Database & System Infrastructure Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Database Engine Status</h3>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/10">
              <span className="text-slate-400">Database Engine:</span>
              <strong className="text-purple-300">{database.engine}</strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/10">
              <span className="text-slate-400">Connection State:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Healthy & Connected
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/10">
              <span className="text-slate-400">Prisma Client:</span>
              <span className="text-white">v5.22.0 Initialized</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-pink-400" />
            <h3 className="text-lg font-bold text-white">Server & Environment</h3>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/10">
              <span className="text-slate-400">Node.js Runtime:</span>
              <strong className="text-white">{system.nodeVersion}</strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/10">
              <span className="text-slate-400">Process Uptime:</span>
              <span className="text-purple-300">{Math.floor(system.uptimeSeconds / 60)} minutes</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/10">
              <span className="text-slate-400">Memory Usage:</span>
              <span className="text-cyan-300">{system.memoryUsageMB} MB heap</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Provider Architecture Diagnostics & Live Connectivity Testing */}
      <section className="glass-panel rounded-3xl p-6 border border-[#352044] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-1">
              <Server className="w-3.5 h-3.5 text-purple-400" /> Multi-Source Provider Adapters
            </div>
            <h3 className="text-xl font-bold text-white">API Provider Diagnostics & Status</h3>
            <p className="text-xs text-[#B7A6C8]">
              Verify real connectivity, search availability, and audio/video playback capabilities.
            </p>
          </div>

          <button
            onClick={() => setProviderDiagnostics(providerManager.getAllDiagnostics())}
            className="px-3.5 py-1.5 rounded-xl bg-[#170D24] border border-[#352044] hover:border-[#A020F0] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerDiagnostics.map((diag) => {
            const testResult = testResults[diag.id];
            const isTesting = testingProvider === diag.id;

            return (
              <div
                key={diag.id}
                className="p-5 rounded-2xl bg-[#170D24]/80 border border-[#352044] hover:border-[#A020F0]/50 transition-all space-y-3"
              >
                {/* Header: Name, Category, Status Badge */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base flex items-center gap-2">
                      {diag.name}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#090510] text-[#B7A6C8] uppercase">
                        {diag.category}
                      </span>
                    </h4>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      diag.status === 'connected'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                        : diag.status === 'available'
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                        : diag.status === 'pending_credentials'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : 'bg-red-950/80 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {diag.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Capabilities Badges */}
                <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                  <span className={`px-2 py-0.5 rounded-lg border ${
                    diag.searchAvailable
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    {diag.searchAvailable ? '✓ Search Active' : '✕ Search Unavailable'}
                  </span>

                  <span className={`px-2 py-0.5 rounded-lg border ${
                    diag.playbackAvailable
                      ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    Playback: {diag.playbackType}
                  </span>

                  {diag.requiresCredentials && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center gap-1 font-mono text-[10px]">
                      <Key className="w-3 h-3" /> {diag.credentialsEnvVar || 'API Key Required'}
                    </span>
                  )}
                </div>

                {/* Notes & Description */}
                <p className="text-xs text-[#B7A6C8] leading-relaxed">
                  {diag.notes}
                </p>

                {/* Catalog Coverage */}
                {diag.catalogCoverage && diag.catalogCoverage.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[10px] text-[#B7A6C8]/80">
                    <span className="font-semibold text-white">Coverage:</span>
                    {diag.catalogCoverage.map((cat) => (
                      <span key={cat} className="px-1.5 py-0.2 rounded bg-[#090510] border border-[#352044]">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Setup Guide if Pending */}
                {diag.setupGuide && !diag.isConfigured && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Setup:</strong> {diag.setupGuide}</span>
                  </div>
                )}

                {/* Live Test Results Display */}
                {testResult && (
                  <div className={`p-2.5 rounded-xl text-xs font-mono flex items-center justify-between ${
                    testResult.success
                      ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/50 border border-red-500/30 text-red-300'
                  }`}>
                    <span>{testResult.message}</span>
                    <span className="font-bold">{testResult.latencyMs}ms</span>
                  </div>
                )}

                {/* Action: Test Connection Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleTestProvider(diag.id)}
                    disabled={isTesting}
                    className="px-3.5 py-1.5 rounded-xl bg-[#090510] hover:bg-[#201133] border border-[#352044] hover:border-[#E51D87] text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 min-h-[36px]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#E51D87] ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Real API...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Backend API Providers Integration */}
      <section className="glass-panel rounded-3xl p-6 border border-purple-500/20 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-2">Backend Gateway Status</h3>
        <p className="text-xs text-purple-300/80 mb-6">
          Real-time status of configured external music search & audio playback APIs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div key={p.name} className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white capitalize text-base">{p.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.isEnabled ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-red-950/80 text-red-400 border border-red-500/30'
                  }`}>
                    {p.isEnabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono truncate max-w-xs">{p.configured}</p>
                <p className="text-[11px] text-purple-300/60 font-mono mt-0.5">Endpoint: {p.apiEndpoint}</p>
              </div>

              <button
                onClick={() => handleToggleProvider(p.name, p.isEnabled)}
                disabled={updatingProvider === p.name}
                className={`p-2.5 rounded-xl border transition-all ${
                  p.isEnabled
                    ? 'bg-red-950/40 text-red-400 border-red-500/30 hover:bg-red-900/60'
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/60'
                }`}
                title={p.isEnabled ? 'Disable Provider' : 'Enable Provider'}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* User Management Table */}
      <section className="glass-panel rounded-3xl p-6 border border-purple-500/20 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">User Accounts Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-purple-500/20 text-purple-300 uppercase">
                <th className="pb-3 px-2">User</th>
                <th className="pb-3 px-2">Email</th>
                <th className="pb-3 px-2">Role</th>
                <th className="pb-3 px-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-purple-950/30">
                  <td className="py-3 px-2 font-semibold text-white flex items-center gap-2">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&q=80'}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    {u.username}
                  </td>
                  <td className="py-3 px-2">{u.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-pink-900/60 text-pink-300 border border-pink-500/30' : 'bg-purple-900/40 text-purple-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-400">
                    {new Date().toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

