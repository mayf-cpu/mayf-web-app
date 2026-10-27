import React from 'react';
import {ChevronDown} from 'lucide-react';

export const FilterDropdown: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string}> = ({label, children, ...props}) => {
  const id = React.useId();
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-500">{label}</label>
      <div className="relative">
        <select {...props} id={id} className="min-h-11 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-xs transition-colors hover:border-slate-300 hover:bg-white focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:text-slate-400">
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
      </div>
    </div>
  );
};

