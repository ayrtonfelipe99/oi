import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageX, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  warehouseId?: string;
}

export const LowStockPanel = ({ warehouseId }: Props) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['dashboard-low-stock', warehouseId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, current_stock, min_stock, warehouse_id, categories(name), warehouses(name)')
        .order('current_stock', { ascending: true });

      if (warehouseId) query = query.eq('warehouse_id', warehouseId);

      const { data, error } = await query;
      if (error) throw error;

      return (data as any[])
        .filter(p => (p.min_stock ?? 0) > 0 && (p.current_stock ?? 0) <= (p.min_stock ?? 0))
        .sort((a, b) => (a.current_stock ?? 0) - (b.current_stock ?? 0));
    },
  });

  return (
    <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
              Alertas de Reposição
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500">
              Itens com estoque igual ou abaixo do mínimo
            </CardDescription>
          </div>
          {!isLoading && (
            <Badge variant="destructive" className="h-6 px-2 text-[10px] font-black rounded-md">
              {items?.length ?? 0} {items?.length === 1 ? 'ITEM' : 'ITENS'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="py-8 text-center text-sm font-medium text-slate-400 flex flex-col items-center gap-2">
            <Package size={28} className="text-slate-300" />
            Nenhum item em alerta de reposição
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1 space-y-2">
            {items.map((p: any) => {
              const zero = (p.current_stock ?? 0) === 0;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm",
                    zero
                      ? "bg-red-50/60 border-red-100"
                      : "bg-amber-50/40 border-amber-100"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    zero ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {zero ? <PackageX size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.categories?.name && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {p.categories.name}
                        </span>
                      )}
                      {p.warehouses?.name && !warehouseId && (
                        <span className="text-[10px] font-medium text-slate-400 truncate">
                          • {p.warehouses.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={cn(
                      "text-lg font-black tabular-nums leading-none",
                      zero ? "text-red-600" : "text-amber-600"
                    )}>
                      {p.current_stock ?? 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      mín. {p.min_stock ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
