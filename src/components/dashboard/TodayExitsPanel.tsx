import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  warehouseId?: string;
}

const PERIODS = [
  { value: '0', label: 'Hoje' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '15', label: 'Últimos 15 dias' },
  { value: '30', label: 'Últimos 30 dias' },
];

export const TodayExitsPanel = ({ warehouseId }: Props) => {
  const [period, setPeriod] = useState('0');

  const { data: items, isLoading } = useQuery({
    queryKey: ['dashboard-exits', warehouseId, period],
    queryFn: async () => {
      const days = parseInt(period, 10);
      const since = new Date();
      if (days === 0) {
        since.setHours(0, 0, 0, 0);
      } else {
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);
      }

      let query = supabase
        .from('transactions')
        .select('id, quantity, created_at, notes, products(name, categories(name)), staff(full_name), warehouses(name)')
        .eq('type', 'out')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (warehouseId) query = query.eq('warehouse_id', warehouseId);

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const totalQty = (items || []).reduce((acc, t) => acc + (t.quantity || 0), 0);
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? '';

  return (
    <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <ArrowUpRight size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
              Saídas
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500">
              {periodLabel}
            </CardDescription>
          </div>
          {!isLoading && (
            <Badge className="h-6 px-2 text-[10px] font-black rounded-md bg-orange-600 hover:bg-orange-600">
              {totalQty} {totalQty === 1 ? 'UNIDADE' : 'UNIDADES'}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 text-xs font-bold rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value} className="text-xs font-medium">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            Nenhuma saída registrada no período
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1 space-y-2">
            {items.map((t: any) => {
              const dt = new Date(t.created_at);
              const isToday = dt.toDateString() === new Date().toDateString();
              const label = isToday
                ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
                  dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-orange-50/40 border-orange-100 transition-all hover:shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                    <ArrowUpRight size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {t.products?.name || 'Produto removido'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {t.staff?.full_name && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {t.staff.full_name}
                        </span>
                      )}
                      {t.warehouses?.name && !warehouseId && (
                        <span className="text-[10px] font-medium text-slate-400 truncate">
                          • {t.warehouses.name}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-400">• {label}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-lg font-black tabular-nums leading-none text-orange-600">
                      −{t.quantity ?? 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      unid.
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
