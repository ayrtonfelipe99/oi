import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  icon?: React.ReactNode;
  /** Tailwind text color class for the icon (e.g. "text-blue-600"). */
  iconClassName?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or extra elements rendered on the right side. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão das páginas do menu (título + ícone + descrição + ações).
 * Mantém alinhamento responsivo idêntico ao usado em todas as páginas.
 */
export function PageHeader({
  icon,
  iconClassName,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 sm:gap-2 break-words leading-tight">
          {icon && (
            <span className={cn('shrink-0 [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-7 sm:[&>svg]:w-7', iconClassName)}>{icon}</span>
          )}
          <span className="min-w-0 break-words">{title}</span>
        </h1>
        {description && (
          <p className="hidden sm:block text-slate-500 font-medium break-words mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-2 w-[98%] mx-auto md:w-auto md:mx-0 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
