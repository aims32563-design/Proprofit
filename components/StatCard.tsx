
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, color = 'emerald' }) => {
  const colorStyles: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/50',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/50',
    purple: 'bg-purple-50 text-purple-600 ring-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-900/50',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/50',
  };

  return (
    <div className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ring-4 ${colorStyles[color]} transition-transform duration-500 group-hover:rotate-12`}>
          {icon}
        </div>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 block mb-0.5">
            {label}
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{value}</span>
        </div>
      </div>
      {subValue && (
        <div className="mt-2 pl-14">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{subValue}</span>
        </div>
      )}
    </div>
  );
};
