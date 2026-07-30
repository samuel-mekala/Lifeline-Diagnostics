import React, { useState } from 'react';
import AdminDataStore from '../../admin/services/adminData';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  FileText,
  UserCheck,
  Building2,
  Check,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from '../../../components/common/RechartsAdapter';

export default function EmployeeWorkAnalysisPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const staff = AdminDataStore.getStaff();

  // Simulated Employee Performance Data
  const employeeData = [
    {
      id: 'STF-001',
      name: 'Dr. Sunita Rao',
      role: 'PATHOLOGIST',
      branch: 'VJW-MAIN',
      reports_reviewed: 142,
      approvals: 138,
      rejections: 4,
      avg_review_time_mins: 8,
      efficiency_score: 98,
    },
    {
      id: 'STF-002',
      name: 'Anil Kumar',
      role: 'LAB_TECHNICIAN',
      branch: 'VJW-MAIN',
      samples_collected: 210,
      home_visits_done: 45,
      results_entered: 195,
      avg_processing_mins: 18,
      efficiency_score: 96,
    },
    {
      id: 'STF-003',
      name: 'Meena Kumari',
      role: 'RECEPTIONIST',
      branch: 'VJW-MAIN',
      direct_registrations: 185,
      payments_collected_inr: 84500,
      issues_resolved: 32,
      efficiency_score: 95,
    },
    {
      id: 'STF-004',
      name: 'Rajesh Varma',
      role: 'LAB_TECHNICIAN',
      branch: 'VJW-MAIN',
      samples_collected: 175,
      home_visits_done: 60,
      results_entered: 160,
      avg_processing_mins: 22,
      efficiency_score: 92,
    },
  ];

  const roleTags = [
    { label: 'Pathologists', value: 'PATHOLOGIST' },
    { label: 'Technicians', value: 'LAB_TECHNICIAN' },
    { label: 'Receptionists', value: 'RECEPTIONIST' },
  ];

  const filteredStaff = employeeData.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || emp.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Chart 1: Staff Workload Comparison
  const chartWorkloadData = [
    { name: 'Dr. Sunita (Pathologist)', tasksCompleted: 142, category: 'Reports Reviewed' },
    { name: 'Anil Kumar (Tech)', tasksCompleted: 210, category: 'Samples Collected' },
    { name: 'Meena Kumari (Recept)', tasksCompleted: 185, category: 'Walk-In Registrations' },
    { name: 'Rajesh Varma (Tech)', tasksCompleted: 175, category: 'Samples Collected' },
  ];

  // Chart 2: Turnaround Speed vs Efficiency Rating
  const chartEfficiencyData = [
    { name: 'Dr. Sunita Rao', Efficiency: 98, SpeedMins: 8 },
    { name: 'Anil Kumar', Efficiency: 96, SpeedMins: 18 },
    { name: 'Meena Kumari', Efficiency: 95, SpeedMins: 5 },
    { name: 'Rajesh Varma', Efficiency: 92, SpeedMins: 22 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> STAFF WORKLOAD & PRODUCTIVITY AUDIT
            </span>
            <span className="text-xs text-slate-400">Live LIMS Operational Analytics</span>
          </div>
          <h1 className="text-2xl font-black mt-2">Employee Work & Efficiency Analysis</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time tracking of technician collection velocity, pathologist approval speed, receptionist walk-in throughput, and overall lab operational health.
          </p>
        </div>

        <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 text-xs text-slate-300 font-bold flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Vijayawada Main Branch Hub</span>
        </div>
      </div>

      {/* Interactive Search Bar & Role Filter */}
      <InteractiveSearchBar
        placeholder="Search staff member, designation, or role..."
        value={searchQuery}
        onChange={setSearchQuery}
        filterTags={roleTags}
        activeTag={selectedRole}
        onSelectTag={setSelectedRole}
        resultCount={filteredStaff.length}
      />

      {/* Bar Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart 1: Tasks Processed per Staff Member */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Work Volume & Output by Employee
              </h3>
              <p className="text-[11px] text-slate-500">Total samples collected, registrations, or reports approved</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">LIVE BAR CHART</span>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="tasksCompleted" fill="#2563eb" radius={[6, 6, 0, 0]}>
                  {chartWorkloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart 2: Staff Efficiency Rating & Speed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Efficiency Rating vs Turnaround Speed
              </h3>
              <p className="text-[11px] text-slate-500">Efficiency score percentage based on SLA and error rates</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">PERFORMANCE %</span>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartEfficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="Efficiency" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Staff Detailed Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" />
            Detailed Staff Performance & Task Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-semibold">Active Roster: {filteredStaff.length} Members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Role</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Key Output</th>
                <th className="p-3">Avg Speed</th>
                <th className="p-3 text-right">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStaff.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{emp.id}</div>
                  </td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-200">
                      {emp.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{emp.branch}</td>
                  <td className="p-3 text-slate-800">
                    {emp.role === 'PATHOLOGIST' && `${emp.reports_reviewed} Reports Audited`}
                    {emp.role === 'LAB_TECHNICIAN' && `${emp.samples_collected} Samples (${emp.home_visits_done} Home Visits)`}
                    {emp.role === 'RECEPTIONIST' && `${emp.direct_registrations} Direct Walk-Ins (₹${emp.payments_collected_inr.toLocaleString()})`}
                  </td>
                  <td className="p-3 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {emp.avg_review_time_mins || emp.avg_processing_mins || 5} mins
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      {emp.efficiency_score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
