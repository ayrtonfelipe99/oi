import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Mantém o mesmo visual de "card pontilhado" das páginas. */
  variant?: 'dashed' | 'plain';
  className?: string;
}

/**
 * Estado vazio reutilizável (ícone grande + título + descrição opcional).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'plain',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-16 px-4 flex flex-col items-center justify-center gap-3',
        variant === 'dashed' &&
          'bg-white rounded-3xl border-2 border-dashed border-slate-100',
        className,
      )}
    >
      <div className="text-slate-300">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 font-medium max-w-md">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
