
import React from 'react';
import { ProgressLevel } from '../../types';

interface BadgeProps {
  status: ProgressLevel;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles = {
    [ProgressLevel.NotStarted]: "bg-slate-100 text-slate-600 border-slate-200",
    [ProgressLevel.OnGoing]: "bg-amber-50 text-amber-700 border-amber-200",
    [ProgressLevel.Complete]: "bg-emerald-50 text-emerald-700 border-emerald-200",
    [ProgressLevel.Hold]: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};
