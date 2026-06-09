import { useQuery } from '@tanstack/react-query';
import { Warehouse, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  hint?: string;
}

/**
 * Mostra um chip "Filtrado por: <almoxarifado>" em qualquer tela.
 * Lê o valor do store global da sidebar e oferece botão "Limpar".
 */
export const WarehouseFilterBadge = ({ className, hint }: Props) => {
  const { warehouseFilter, setWarehouseFilter } = useWarehouseFilterStore();

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');
      return data ?? [];
    },
  });

  if (warehouseFilter === 'all') return null;
  const wh = warehouses?.find((w: any) => w.id === warehouseFilter);
  const name = wh?.name || 'Almoxarifado selecionado';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Warehouse className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="font-bold truncate">Filtrado por: {name}</span>
        {hint && (
          <span className="hidden sm:inline text-xs text-amber-700/80 truncate">
            · {hint}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setWarehouseFilter('all')}
        className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 transition"
      >
        <X className="h-3.5 w-3.5" /> Limpar
      </button>
    </div>
  );
};
