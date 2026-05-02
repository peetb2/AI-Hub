"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserQuota {
  id: string;
  email: string;
  quota: number;
  used: number;
  remaining: number;
  percentUsed: number;
}

export default function AdminTokenQuotaPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/token-quota/list');

      // Allow the page to render even if server returns 401/403; show error instead
      if (response.status === 401) {
        setError('Please sign in to access quota data.');
        return;
      }
      if (response.status === 403) {
        setError('You do not have permission to view quota data.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserQuota) => {
    setEditingId(user.id);
    setEditValue(user.quota);
  };

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return user.email.toLowerCase().includes(query);
  });

  const totalQuota = users.reduce((sum, user) => sum + user.quota, 0);
  const totalUsed = users.reduce((sum, user) => sum + user.used, 0);
  const totalRemaining = users.reduce((sum, user) => sum + user.remaining, 0);

  const handleSave = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/token-quota/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_token_quota: editValue }),
      });

      if (!response.ok) throw new Error('Failed to update quota');

      setEditingId(null);
      await fetchQuotaData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quota');
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render page even if not admin; errors are shown in the UI

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
              >
                Back to Admin Home
              </button>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white mb-2">Token Quota Management</h1>
            <p className="text-slate-400">View and manage per-user monthly token quotas</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="text-slate-400 text-xs uppercase tracking-wide">Users</div>
              <div className="mt-1 text-white font-semibold">{users.length}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="text-slate-400 text-xs uppercase tracking-wide">Used</div>
              <div className="mt-1 text-white font-semibold">{totalUsed.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="text-slate-400 text-xs uppercase tracking-wide">Remaining</div>
              <div className="mt-1 text-white font-semibold">{totalRemaining.toLocaleString()}</div>
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="block flex-1 max-w-md">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500">Search user</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by email"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-purple-400/50"
            />
          </label>
          <button
            onClick={fetchQuotaData}
            className="self-start rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-black/60">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    User Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Monthly Quota
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Used
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Remaining
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Usage %
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white/80">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-white/80">
                      {editingId === user.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-32 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                        />
                      ) : (
                        user.quota.toLocaleString()
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/80">
                      {user.used.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-400">
                      {user.remaining.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              user.percentUsed < 50
                                ? 'bg-emerald-500'
                                : user.percentUsed < 80
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(user.percentUsed, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-white/60 w-8 text-right">
                          {user.percentUsed}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {editingId === user.id ? (
                        <>
                          <button
                            onClick={() => handleSave(user.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-slate-400">No users found</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">ℹ️ About Token Quotas</h3>
          <p className="text-xs text-blue-200/70">
            Monthly quotas reset on the 1st of each month. Quotas are measured in characters (sum of input and output).
            Users cannot use tokens when they reach their monthly limit.
          </p>
        </div>
      </div>
    </div>
  );
}
