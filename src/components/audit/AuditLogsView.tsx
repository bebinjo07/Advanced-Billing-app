import React, { useState, useMemo } from 'react';
import { ShieldAlert, Search, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

export const AuditLogsView: React.FC = () => {
  const logs = useLiveQuery(() => db.auditLogs.toArray(), []) || [];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return logs
      .filter(
        (l) =>
          l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.module.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Audit & Activity Log</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Immutable system log tracking invoice creation, payment entries, stock updates & user actions
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, user, module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Module</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredLogs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="p-3.5 text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{new Date(l.timestamp).toLocaleString()}</span>
                </td>
                <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">{l.userName}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold text-[10px] text-slate-600">
                    {l.module}
                  </span>
                </td>
                <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">{l.action}</td>
                <td className="p-3.5 text-slate-500">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
