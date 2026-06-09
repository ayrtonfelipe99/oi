import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Trash2,
  Package,
  ChevronRight,
  ChevronDown,
  History as HistoryIcon,
  AlertTriangle,
  PackagePlus,
  QrCode,
  Pencil,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductCodesDialog } from './ProductCodesDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface ProductsTableProps {
  products: any[];
  isLoading?: boolean;
  accentColor?: 'blue' | 'indigo';
  emptyLabel?: string;
  onChanged?: () => void;
  onEdit?: (product: any) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  isLoading,
  accentColor = 'blue',
  emptyLabel = 'Nenhum item encontrado.',
  onChanged,
  onEdit,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [codesProduct, setCodesProduct] = useState<any | null>(null);
  const navigate = useNavigate();
  const restockRoute = accentColor === 'indigo' ? '/cadastro-ferramentas' : '/cadastro-epis';
  const goRestock = (productId: string) => {
    navigate({ to: restockRoute, search: { restock: productId } as any });
  };

  const accent =
    accentColor === 'indigo'
      ? { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', solid: 'bg-indigo-600 hover:bg-indigo-700' }
      : { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', solid: 'bg-blue-600 hover:bg-blue-700' };

  const lowStockItems = useMemo(
    () => products.filter((p) => (p.current_stock || 0) <= (p.min_stock || 0) && (p.min_stock || 0) > 0),
    [products],
  );

  return (
    <div className="space-y-4">
      {lowStockItems.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200/70 text-amber-800 rounded-xl shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <h3 className="font-black text-amber-900 text-sm uppercase tracking-wider">
                  Reposição necessária
                </h3>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-200 text-amber-900">
                  {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'itens'} abaixo do mínimo
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((p) => {
                  const need = Math.max(1, (p.min_stock || 0) - (p.current_stock || 0));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => goRestock(p.id)}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-200 rounded-full text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition-colors shadow-sm"
                      title={`Repor ${p.name}`}
                    >
                      <span className="truncate max-w-[180px]">{p.name}</span>
                      <span className="text-red-600 font-black">
                        {p.current_stock || 0}/{p.min_stock || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200">
                        <PackagePlus size={11} /> +{need}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile compact list */}
      <div className="md:hidden bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-400">
            <Package size={28} className="mx-auto mb-2" />
            <p className="text-sm font-medium">{emptyLabel}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {products.map((p) => {
              const low = (p.current_stock || 0) <= (p.min_stock || 0) && (p.min_stock || 0) > 0;
              const empty = (p.current_stock || 0) === 0;
              const isExpanded = expandedId === p.id;
              const inUse = p.in_use ?? 0;
              const damaged = p.damaged ?? 0;
              const statusTone = empty
                ? { dot: 'bg-red-500', label: 'Esgotado', labelCls: 'bg-red-50 text-red-700 border-red-200', stockCls: 'text-red-700', stockBg: 'bg-red-50 border-red-200' }
                : low
                ? { dot: 'bg-amber-500', label: 'Repor', labelCls: 'bg-amber-50 text-amber-700 border-amber-200', stockCls: 'text-amber-700', stockBg: 'bg-amber-50 border-amber-200' }
                : { dot: 'bg-emerald-500', label: 'OK', labelCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', stockCls: 'text-emerald-700', stockBg: 'bg-emerald-50 border-emerald-200' };

              const Metric = ({
                label,
                value,
                tone,
              }: {
                label: string;
                value: number | string;
                tone: string;
              }) => (
                <div className={cn('flex flex-col items-center justify-center rounded-lg border px-1 py-1.5', tone)}>
                  <span className="text-[8px] uppercase tracking-wider font-black opacity-70 leading-none">{label}</span>
                  <span className="mt-1 text-base font-black tabular-nums leading-none">{value}</span>
                </div>
              );

              return (
                <li key={p.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : p.id);
                      }
                    }}
                    className="w-full text-left px-3 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    {/* Cabeçalho: nome + status + ações */}
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">
                        {isExpanded ? <ChevronDown size={14} className={accent.text} /> : <ChevronRight size={14} className={accent.text} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm text-slate-900 uppercase tracking-tight break-words">{p.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <Package size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.warehouses?.name || 'Geral'}</span>
                          {p.sku && <span className="text-slate-300">·</span>}
                          {p.sku && <span className="font-mono text-slate-500 truncate">{p.sku}</span>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setCodesProduct(p); }}>
                            <QrCode size={14} className="mr-2" /> Códigos
                          </DropdownMenuItem>
                          {onEdit && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                              <Pencil size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); goRestock(p.id); }}
                            className={cn('font-bold', accent.text)}
                          >
                            <PackagePlus size={14} className="mr-2" /> Repor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Métricas */}
                    <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                      <Metric label="Dispon." value={p.current_stock || 0} tone={cn(statusTone.stockBg, statusTone.stockCls)} />
                      <Metric label="Em Uso" value={inUse} tone="border-sky-200 bg-sky-50 text-sky-700" />
                      <Metric label="Avariad." value={damaged} tone="border-rose-200 bg-rose-50 text-rose-700" />
                      <Metric label="Mín." value={p.min_stock || 0} tone="border-slate-200 bg-slate-50 text-slate-700" />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className={cn('p-3 border-t', accent.bg, accent.border)}>
                      <PurchaseHistory
                        productId={p.id}
                        currentStock={p.current_stock || 0}
                        accent={accent}
                        onChanged={onChanged}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>




      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-3 py-3 text-left border-r border-slate-200">Nome</th>
                <th className="px-3 py-3 text-left border-r border-slate-200 w-32">SKU</th>
                <th className="px-3 py-3 text-left border-r border-slate-200 w-40">Marca</th>
                <th className="px-3 py-3 text-left border-r border-slate-200 w-28">Qtd.</th>
                <th className="px-3 py-3 text-left border-r border-slate-200 w-20">Mín.</th>
                <th className="px-3 py-3 text-left border-r border-slate-200 w-52">Almoxarifado</th>
                <th className="px-3 py-3 text-center w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td colSpan={7} className="px-3 py-4">
                      <div className="h-6 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Package size={32} />
                      <p className="font-medium">{emptyLabel}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => {
                  const low = (p.current_stock || 0) <= (p.min_stock || 0) && (p.min_stock || 0) > 0;
                  const isExpanded = expandedId === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        className={cn(
                          'border-b border-slate-100 hover:bg-slate-50/70 transition-colors',
                          idx % 2 === 1 && 'bg-slate-50/40',
                          isExpanded && accent.bg,
                          low && !isExpanded && 'bg-amber-50/40',
                        )}
                      >
                        <td className="px-3 py-2 border-r border-slate-100 font-semibold text-slate-800 uppercase">
                          <button
                            type="button"
                            className={cn(
                              'flex items-center gap-1.5 text-left w-full hover:underline',
                              accent.text,
                            )}
                            onClick={() => setExpandedId(isExpanded ? null : p.id)}
                            title="Ver histórico de entradas"
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} className="shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="shrink-0" />
                            )}
                            <span>{p.name}</span>
                            {low && (
                              <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 font-mono text-xs text-slate-500">
                          {p.sku || '—'}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <span className={cn('text-slate-700', !p.brand && 'text-slate-300 italic')}>
                            {p.brand || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <Badge
                            variant={low ? 'destructive' : 'outline'}
                            className="rounded-md font-bold"
                          >
                            {p.current_stock || 0} {p.unit}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-slate-500 text-xs">
                          {p.min_stock || 0}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-slate-600 text-xs">
                          {p.warehouses?.name || 'Geral'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-100"
                              onClick={() => setCodesProduct(p)}
                              title="Ver QR Code e código de barras"
                            >
                              <QrCode size={14} className="text-slate-700" />
                            </Button>
                            {onEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-100"
                                onClick={() => onEdit(p)}
                                title="Editar"
                              >
                                <Pencil size={14} className="text-slate-700" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className={cn(
                                'h-8 rounded-lg font-bold text-white text-xs gap-1.5 shadow-sm',
                                accent.solid,
                              )}
                              onClick={() => goRestock(p.id)}
                              title="Repor estoque"
                            >
                              <PackagePlus size={13} />
                              Repor
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className={cn('border-b border-slate-200', accent.bg)}>
                          <td colSpan={7} className="px-6 py-4">
                            <PurchaseHistory
                              productId={p.id}
                              currentStock={p.current_stock || 0}
                              accent={accent}
                              onChanged={onChanged}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
          Use <strong>Repor</strong> para adicionar entrada rápida. Clique no <strong>nome</strong> para ver o histórico.
        </div>
      </div>

      <ProductCodesDialog
        product={codesProduct}
        open={!!codesProduct}
        onOpenChange={(o) => !o && setCodesProduct(null)}
      />
    </div>
  );
};

const PurchaseHistory: React.FC<{
  productId: string;
  currentStock: number;
  accent: { text: string; bg: string; border: string };
  onChanged?: () => void;
}> = ({ productId, currentStock, accent, onChanged }) => {
  const queryClient = useQueryClient();
  const [confirmRow, setConfirmRow] = useState<any>(null);
  const [detailRow, setDetailRow] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['product-purchases', productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('product_purchases')
        .select('id, quantity, brand, notes, registered_by, created_at, warehouses(name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const totalQty = (data || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalEntries = data?.length || 0;
  const brandPalette = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  ];
  const brandColorMap = React.useMemo(() => {
    const map = new Map<string, (typeof brandPalette)[number]>();
    let i = 0;
    (data || []).forEach((r) => {
      const key = (r.brand || '').trim().toUpperCase();
      if (key && !map.has(key)) {
        map.set(key, brandPalette[i % brandPalette.length]);
        i++;
      }
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const neutralBrand = { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' };
  const getBrandColor = (brand?: string) => {
    const key = (brand || '').trim().toUpperCase();
    if (!key) return neutralBrand;
    return brandColorMap.get(key) || neutralBrand;
  };
  const brandTotals = React.useMemo(() => {
    const m = new Map<string, number>();
    (data || []).forEach((r) => {
      const key = (r.brand || '').trim() || 'Sem marca';
      m.set(key, (m.get(key) || 0) + (Number(r.quantity) || 0));
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);
  const rowsDesc = React.useMemo(() => {
    if (!data) return [] as any[];
    let running = 0;
    const enriched = data.map((r) => {
      const before = running;
      running += Number(r.quantity) || 0;
      return { ...r, before, running };
    });
    return enriched.slice().reverse();
  }, [data]);

  const handleDeleteEntry = async () => {
    if (!confirmRow) return;
    setDeleting(true);
    const qty = Number(confirmRow.quantity) || 0;
    const wasLast = (data?.length ?? 0) <= 1;

    const { error: delErr } = await (supabase as any)
      .from('product_purchases')
      .delete()
      .eq('id', confirmRow.id);
    if (delErr) {
      setDeleting(false);
      toast.error('Erro ao excluir entrada: ' + delErr.message);
      return;
    }

    if (wasLast) {
      const { error: prodErr } = await supabase.from('products').delete().eq('id', productId);
      setDeleting(false);
      if (prodErr) {
        toast.error('Entrada excluída, mas falhou ao remover o item: ' + prodErr.message);
      } else {
        toast.success('Item removido (sem entradas no histórico)');
      }
    } else {
      const newStock = Math.max(0, currentStock - qty);
      const { error: updErr } = await (supabase.from('products') as any)
        .update({ current_stock: newStock })
        .eq('id', productId);
      setDeleting(false);
      if (updErr) {
        toast.error('Entrada excluída, mas falhou ao atualizar estoque: ' + updErr.message);
      } else {
        toast.success(`Entrada removida. Estoque: ${newStock}`);
      }
    }

    setConfirmRow(null);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products-epis'] });
    queryClient.invalidateQueries({ queryKey: ['products-tools'] });
    onChanged?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className={cn('flex items-center gap-2 text-sm font-black uppercase tracking-tight', accent.text)}>
          <HistoryIcon size={15} />
          Histórico de Entradas
        </div>
        {totalEntries > 0 && (
          <div className="text-[11px] text-slate-500 font-semibold">
            <span className="text-slate-700">{totalEntries}</span> {totalEntries === 1 ? 'entrada' : 'entradas'}
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="text-emerald-700 font-black">+{totalQty}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs text-slate-400">Carregando...</div>
      ) : !rowsDesc.length ? (
        <div className="text-xs text-slate-400 italic py-2">
          Nenhuma entrada registrada ainda.
        </div>
      ) : (
        <>
          {/* Mobile: lista enxuta */}
          <div className="md:hidden bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {rowsDesc.map((row, idx) => {
              const order = totalEntries - idx;
              const isFirst = order === 1;
              const c = getBrandColor(row.brand);
              return (
                <div
                  key={row.id}
                  onClick={() => setDetailRow({ ...row, order, isFirst })}
                  className="px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center justify-center min-w-[26px] h-5 px-1 rounded text-[10px] font-black',
                      isFirst ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {isFirst ? '1º' : order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                      <span>{new Date(row.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                      {row.brand && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className={cn('inline-flex items-center gap-1 truncate', c.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', c.dot)} />
                            <span className="truncate">{row.brand}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {row.registered_by && (
                      <div className="text-[10px] text-slate-400 truncate">por {row.registered_by}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-emerald-700 tabular-nums leading-none">+{row.quantity}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400 tabular-nums">→ {row.running}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-slate-300 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); setConfirmRow(row); }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Desktop: tabela enxuta */}
          <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-3 py-2 text-left w-12">#</th>
                  <th className="px-3 py-2 text-left w-36">Data</th>
                  <th className="px-3 py-2 text-right w-20">Qtd.</th>
                  <th className="px-3 py-2 text-right w-20">Estoque</th>
                  <th className="px-3 py-2 text-left">Marca</th>
                  <th className="px-3 py-2 text-left">Responsável</th>
                  <th className="px-3 py-2 text-center w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rowsDesc.map((row, idx) => {
                  const order = totalEntries - idx;
                  const isFirst = order === 1;
                  const c = getBrandColor(row.brand);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setDetailRow({ ...row, order, isFirst })}
                      className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded text-[10px] font-black',
                            isFirst ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {isFirst ? '1º' : order}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2 text-right font-black text-emerald-700 tabular-nums">+{row.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-500 tabular-nums">→ {row.running}</td>
                      <td className="px-3 py-2">
                        {row.brand ? (
                          <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold', c.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
                            {row.brand}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.registered_by || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-300 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setConfirmRow(row); }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}


      <Dialog open={!!detailRow} onOpenChange={(o) => !o && setDetailRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HistoryIcon size={18} className={accent.text} />
              Detalhes da Entrada
              {detailRow && (
                <span
                  className={cn(
                    'ml-auto inline-flex items-center justify-center h-6 px-2 rounded-md text-[10px] font-black',
                    detailRow.isFirst
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {detailRow.isFirst ? '1ª entrada' : `#${detailRow.order}`}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Informações completas desta entrada no histórico.
            </DialogDescription>
          </DialogHeader>
          {detailRow && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Quantidade</div>
                  <div className="text-2xl font-black text-emerald-700">+{detailRow.quantity}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Estoque</div>
                  <div className="flex items-center gap-1.5 text-sm font-bold mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{detailRow.before}</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{detailRow.running}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Data e hora</span>
                  <span className="text-slate-700 font-semibold">
                    {new Date(detailRow.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Marca</span>
                  <span className="text-slate-700 font-semibold">{detailRow.brand || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Almoxarifado</span>
                  <span className="text-slate-700 font-semibold">{detailRow.warehouses?.name || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Responsável</span>
                  <span className="text-slate-700 font-semibold">{detailRow.registered_by || '—'}</span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Observações</div>
                <p className="text-slate-700 italic break-words">
                  {detailRow.isFirst && !detailRow.notes ? 'Cadastro inicial' : detailRow.notes || 'Sem observações'}
                </p>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => { setConfirmRow(detailRow); setDetailRow(null); }}
                >
                  <Trash2 size={13} className="mr-1.5" />
                  Excluir entrada
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!confirmRow} onOpenChange={(o) => !o && setConfirmRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrada do histórico</AlertDialogTitle>
            <AlertDialogDescription>
              Esta entrada de <strong>+{confirmRow?.quantity}</strong> será removida e a quantidade
              será descontada do estoque atual. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteEntry();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

