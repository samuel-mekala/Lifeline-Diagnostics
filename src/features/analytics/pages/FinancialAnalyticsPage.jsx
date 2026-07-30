import React, { useState, useEffect } from 'react';
import AdminDataStore from '../../admin/services/adminData';
import {
  TrendingUp,
  CreditCard,
  Building2,
  PieChart as PieIcon,
  BarChart2,
  Calendar,
  IndianRupee,
  Activity,
  ArrowUpRight,
  Filter,
  Download,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from '../../../components/common/RechartsAdapter';

export default function FinancialAnalyticsPage() {
  const [dateRange, setDateRange] = useState('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState('2026-07-01');
  const [customEndDate, setCustomEndDate] = useState('2026-07-29');

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    setMetrics(AdminDataStore.getFinancialSummary(dateRange));
  }, [dateRange]);

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> EXECUTIVE FINANCIAL DASHBOARD
            </span>
            <span className="text-xs text-slate-400">Live Revenue Ledger</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Financial Analytics, Revenue & Branch Yield</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time financial breakdown covering direct walk-in vs physician referral earnings, payment gateway ratios, and branch yield metrics.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 flex items-center gap-1 text-xs font-bold text-slate-300">
          <button
            onClick={() => setDateRange('TODAY')}
            className={`px-3 py-1.5 rounded-lg transition ${
              dateRange === 'TODAY' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-lg transition ${
              dateRange === 'THIS_WEEK' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateRange('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg transition ${
              dateRange === 'THIS_MONTH' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Top KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-extrabold tracking-wider">
            <span>Total Collections</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">₹{metrics.total_revenue.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs previous period
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-extrabold tracking-wider">
            <span>Direct Patient Revenue</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">₹{metrics.direct_revenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium">66.8% of Total Billing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-extrabold tracking-wider">
            <span>Doctor Referral Revenue</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">₹{metrics.referral_revenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium">33.2% of Total Billing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-extrabold tracking-wider">
            <span>Digital Payment Ratio</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">78%</div>
          <div className="text-xs text-emerald-600 font-bold">UPI / Cards Lead Collections</div>
        </div>
      </div>

      {/* Charts Row 1: Daily Revenue Trend & Payment Method Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Daily Revenue Trend Breakdown
            </h2>
            <span className="text-xs text-slate-400 font-bold">Direct vs Referral Revenue</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.daily_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReferral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`₹${val}`, '']} />
                <Area type="monotone" dataKey="direct" name="Direct Revenue" stroke="#2563EB" fillOpacity={1} fill="url(#colorDirect)" />
                <Area type="monotone" dataKey="referral" name="Referral Revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorReferral)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Gateway Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Collection Methods
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">UPI, Cards, Cash, and Corporate billing ratios.</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.payment_method_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {metrics.payment_method_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`₹${val}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
            {metrics.payment_method_breakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-700">{item.name} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Branch Financial Yield & Diagnostic Test Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Financial Yield Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Branch Collection & Ticket Size Yield
          </h2>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Branch Hub</th>
                  <th className="p-3">Total Revenue</th>
                  <th className="p-3">Visits</th>
                  <th className="p-3">Avg Ticket Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {metrics.branch_yield.map((b) => (
                  <tr key={b.code} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{b.branch}</div>
                      <div className="font-mono text-[10px] text-blue-600">{b.code}</div>
                    </td>
                    <td className="p-3 font-mono font-extrabold text-emerald-700">₹{b.revenue.toLocaleString()}</td>
                    <td className="p-3 font-mono text-slate-700">{b.visits} visits</td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{b.avg_ticket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diagnostic Test Popularity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Most Popular Diagnostic Test Revenue Yield
          </h2>

          <div className="space-y-3">
            {metrics.top_popular_tests.map((test, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{test.test_name}</span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Category: {test.category} • Volume: <strong>{test.volume} tests</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-slate-900 text-sm">₹{test.revenue.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">Top Performer</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Row 3: Sample Analytics & Departmental Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              Sample Analytics & Specimen Processing Volume Bar Chart
            </h2>
            <p className="text-xs text-slate-500">Live sample accessioning breakdown by specimen tube container type and processing SLA</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-200">
            Vijayawada Hub SLA: 98.4% On-Time
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Sample Volume Bar Chart */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Specimen Count by Container Tube Type</span>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { category: 'SST Gel (Yellow)', volume: 340, fill: '#eab308' },
                    { category: 'EDTA Blood (Purple)', volume: 280, fill: '#a855f7' },
                    { category: 'Sodium Fluoride (Gray)', volume: 150, fill: '#64748b' },
                    { category: 'Sterile Container (Urine)', volume: 120, fill: '#0284c7' },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-5} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                    {[
                      { fill: '#eab308' },
                      { fill: '#a855f7' },
                      { fill: '#64748b' },
                      { fill: '#0284c7' },
                    ].map((entry, index) => (
                      <Cell key={`cell-specimen-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department TAT Bar Chart */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Average Processing Turnaround Time (Hours)</span>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { dept: 'Hematology', hours: 2.2 },
                    { dept: 'Biochemistry', hours: 3.8 },
                    { dept: 'Immunology', hours: 5.5 },
                    { dept: 'Pathology', hours: 4.0 },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(val) => [`${val} Hours`, 'Avg TAT']} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                  <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
