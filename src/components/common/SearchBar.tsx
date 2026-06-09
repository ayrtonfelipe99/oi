import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Elementos extras renderizados ao lado do input (ex: filtros). */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * Barra de busca padrão (input dentro de um card branco com ícone de lupa).
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  trailing,
  className,
}: SearchBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm',
        className,
      )}
    >
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={placeholder}
          className="pl-10 border-none bg-transparent focus-visible:ring-0 w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {trailing}
    </div>
  );
}

export default SearchBar;
