import React, { useState } from 'react';

export const ResponsiveContainer = ({ children }) => (
  <div className="w-full h-full min-h-[180px] relative flex items-center justify-center">
    {children}
  </div>
);

export const CartesianGrid = () => null;
export const XAxis = () => null;
export const YAxis = () => null;
export const Tooltip = () => null;
export const Legend = () => null;
export const Cell = () => null;

export const AreaChart = ({ data = [], children }) => {
  const values = data.map((d) => (d.direct || 0) + (d.referral || 0));
  const maxVal = Math.max(...values, 100);

  return (
    <div className="w-full h-full flex flex-col justify-between py-2">
      <div className="flex-1 flex items-end gap-2 px-2 border-b border-slate-200 pb-2">
        {data.map((item, i) => {
          const directH = Math.round(((item.direct || 0) / maxVal) * 100);
          const referralH = Math.round(((item.referral || 0) / maxVal) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 pointer-events-none whitespace-nowrap">
                <p className="font-bold">{item.date}</p>
                <p className="text-blue-400">Direct: ₹{item.direct?.toLocaleString()}</p>
                <p className="text-emerald-400">Referral: ₹{item.referral?.toLocaleString()}</p>
              </div>

              <div className="w-full max-w-[24px] flex flex-col items-center gap-0.5 h-44 justify-end">
                <div
                  style={{ height: `${directH}%` }}
                  className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                />
                <div
                  style={{ height: `${referralH}%` }}
                  className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold truncate w-full text-center">
                {item.date?.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-600 rounded-sm" /> Direct Revenue
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> Referral Revenue
        </div>
      </div>
    </div>
  );
};

export const Area = () => null;

export const PieChart = ({ children }) => {
  return (
    <div className="relative w-36 h-36 rounded-full border-8 border-slate-100 flex items-center justify-center bg-gradient-to-br from-blue-500 via-emerald-500 to-amber-500 shadow-inner">
      <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-md">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Yield</span>
        <span className="text-sm font-black text-slate-800">100%</span>
      </div>
    </div>
  );
};

export const Pie = () => null;

export const BarChart = ({ data = [], children }) => {
  const values = data.map((d) => d.volume || d.hours || d.processed || 0);
  const maxVal = Math.max(...values, 10);

  return (
    <div className="w-full h-full flex flex-col justify-between py-2">
      <div className="flex-1 flex items-end gap-3 px-2 border-b border-slate-200 pb-2">
        {data.map((item, i) => {
          const val = item.volume || item.hours || item.processed || 0;
          const label = item.category || item.dept || item.name || `Item ${i + 1}`;
          const heightPct = Math.round((val / maxVal) * 100);
          const color = item.fill || (i % 2 === 0 ? '#2563eb' : '#10b981');

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md z-20 whitespace-nowrap">
                {label}: <strong className="text-emerald-400">{val}</strong>
              </div>
              <div className="w-full max-w-[32px] h-36 flex flex-col justify-end">
                <div
                  style={{ height: `${Math.max(heightPct, 8)}%`, backgroundColor: color }}
                  className="w-full rounded-t-md transition-all hover:opacity-90"
                />
              </div>
              <span className="text-[10px] text-slate-600 font-bold truncate w-full text-center">
                {label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Bar = () => null;
