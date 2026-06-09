import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatCardTone =
  | 'blue'
  | 'indigo'
  | 'amber'
  | 'emerald'
  | 'slate'
  | 'rose'
  | 'violet';

const TONE_MAP: Record<
  StatCardTone,
  { border: string; iconBg: string; iconText: string }
> = {
  blue: { border: 'border-b-blue-500', iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
  indigo: { border: 'border-b-indigo-500', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
  amber: { border: 'border-b-amber-500', iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
  emerald: { border: 'border-b-emerald-500', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
  slate: { border: 'border-b-slate-500', iconBg: 'bg-slate-50', iconText: 'text-slate-600' },
  rose: { border: 'border-b-rose-500', iconBg: 'bg-rose-50', iconText: 'text-rose-600' },
  violet: { border: 'border-b-violet-500', iconBg: 'bg-violet-50', iconText: 'text-violet-600' },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: StatCardTone;
  className?: string;
}

/**
 * Cartão de estatística usado nas páginas de cadastro/listagem.
 * Mesmo visual usado em EPIs, Ferramentas, Staff, etc.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = 'blue',
  className,
}: StatCardProps) {
  const t = TONE_MAP[tone];
  return (
    <Card
      className={cn(
        'p-2.5 sm:p-4 rounded-2xl sm:rounded-[24px] bg-white border-slate-100 shadow-sm border-b-4',
        'flex flex-col items-center text-center gap-1.5 sm:flex-row sm:items-center sm:text-left sm:gap-4',
        t.border,
        className,
      )}
    >
      <div className={cn('p-2 sm:p-3 rounded-xl sm:rounded-2xl shrink-0', t.iconBg, t.iconText, '[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-6 sm:[&>svg]:w-6')}>
        {icon}
      </div>
      <div className="min-w-0 w-full sm:w-auto">
        <p className="text-[9px] sm:text-[10px] leading-tight uppercase font-bold text-slate-400 line-clamp-2">{label}</p>
        <p className="text-lg sm:text-2xl font-black text-slate-900 truncate leading-tight">{value}</p>
      </div>
    </Card>
  );
}

export default StatCard;
