import React, { useState, useEffect } from 'react';
import AdminDataStore from '../services/adminData';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  UserCheck,
  Building,
  Key,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  Download,
  Terminal,
} from 'lucide-react';

export default function SystemAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('ALL');

  const refreshLogs = () => {
    setLogs(AdminDataStore.getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRoleFilter === 'ALL' || log.role === selectedRoleFilter;
    const matchesSeverity = selectedSeverityFilter === 'ALL' || log.severity === selectedSeverityFilter;

    return matchesSearch && matchesRole && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> SECURITY & AUDIT TRAIL
            </span>
            <span className="text-xs text-slate-400">HIPAA & NABL Compliance Log</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">System Audit Trail & Access Monitor</h1>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident audit ledger capturing user registrations, parameter modifications, pathologist sign-offs, and administrative security events.
          </p>
        </div>

        <button
          onClick={() => alert('Audit logs exported as CSV report.')}
          className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2"
        >
          <Download className="w-4 h-4 text-emerald-400" /> Export Compliance CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto">
          <InteractiveSearchBar
            placeholder="Search user, IP address, visit ID, or audit action..."
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={[
              'LOGIN_SUCCESS',
              'RESULT_APPROVAL',
              'Dr. Ramesh Varma',
              '192.168.1.102',
            ]}
            resultCount={filteredLogs.length}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="PATHOLOGIST">PATHOLOGIST</option>
              <option value="LAB_TECHNICIAN">LAB_TECHNICIAN</option>
              <option value="RECEPTIONIST">RECEPTIONIST</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp & IP Address</th>
                <th className="p-4">User & Role</th>
                <th className="p-4">Action & Target Entity</th>
                <th className="p-4">Audit Log Details</th>
                <th className="p-4 text-center">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    No matching security audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">IP: {log.ip_address}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900">{log.user_name}</div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 uppercase mt-1 inline-block">
                        {log.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-blue-600 font-mono">{log.action}</div>
                      <div className="text-[11px] text-slate-500 font-bold mt-0.5">{log.target_entity}</div>
                    </td>

                    <td className="p-4 text-slate-700 max-w-md">
                      <p className="text-xs leading-relaxed">{log.details}</p>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
