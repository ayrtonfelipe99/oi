import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, ScanLine, Search, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { QrScanner } from './QrScanner';
import type { StaffRecord } from './StepIdentifyStaff';
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';

export interface ItemLine {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  warehouseId: string;
  available: number;
}

interface Props {
  kind: 'epi' | 'tool';
  type: 'out' | 'return';
  staff: StaffRecord;
  onBack: () => void;
  onContinue: (items: ItemLine[]) => void;
}

export const StepPickItems = ({ kind, type, staff, onBack, onContinue }: Props) => {
  const [code, setCode] = useState('');
  const [items, setItems] = useState<ItemLine[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [returnableBalance, setReturnableBalance] = useState<Map<string, number>>(new Map());
  const [loadingBalance, setLoadingBalance] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { warehouseFilter } = useWarehouseFilterStore();
  const warehouseScope = warehouseFilter !== 'all' ? warehouseFilter : undefined;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // For returns: load what staff currently holds
  useEffect(() => {
    if (type !== 'return') return;
    setLoadingBalance(true);
    (async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('product_id, type, quantity')
        .eq('staff_id', staff.id)
        .in('type', ['out', 'return']);
      setLoadingBalance(false);
      if (error || !data) return;
      const m = new Map<string, number>();
      for (const t of data) {
        if (!t.product_id) continue;
        const delta = t.type === 'out' ? t.quantity : -t.quantity;
        m.set(t.product_id, (m.get(t.product_id) || 0) + delta);
      }
      setReturnableBalance(m);
    })();
  }, [staff.id, type]);

  const filterByCategory = (rows: any[]) =>
    rows.filter((p) => {
      if (kind === 'epi') return p.categories?.type === 'epi' || p.ca_number;
      return p.categories?.type === 'tool';
    });

  const addProduct = async (codeOrId: string, byId = false) => {
    const value = codeOrId.trim();
    if (!value) return;
    if (!warehouseScope) {
      toast.error('Selecione um almoxarifado no menu lateral antes de adicionar itens.');
      return;
    }
    let query = supabase
      .from('products')
      .select('id, name, sku, current_stock, warehouse_id, ca_number, categories(type)')
      .limit(5);
    query = byId ? query.eq('id', value) : query.eq('sku', value);
    if (warehouseScope) query = query.eq('warehouse_id', warehouseScope);
    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao buscar produto');
      return;
    }
    const list = filterByCategory(data || []);
    if (list.length === 0) {
      toast.error(`Produto não encontrado nesta categoria (${kind === 'epi' ? 'EPI' : 'Ferramenta'})`);
      return;
    }
    const p = list[0];
    if (type === 'return' && (returnableBalance.get(p.id) || 0) <= 0) {
      toast.error('Este colaborador não possui este item em posse');
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === p.id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.available) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          quantity: 1,
          warehouseId: p.warehouse_id,
          available:
            type === 'return'
              ? returnableBalance.get(p.id) || 0
              : p.current_stock || 0,
        },
      ];
    });
    setCode('');
    inputRef.current?.focus();
  };

  const doSearch = async () => {
    if (!searchTerm.trim()) return;
    let q = supabase
      .from('products')
      .select('id, name, sku, current_stock, warehouse_id, ca_number, categories(type)')
      .ilike('name', `%${searchTerm.trim()}%`)
      .limit(20);
    if (warehouseScope) q = q.eq('warehouse_id', warehouseScope);
    const { data } = await q;
    setSearchResults(filterByCategory(data || []));
  };

  const canContinue = useMemo(
    () => items.length > 0 && items.every((i) => i.quantity > 0 && i.quantity <= i.available),
    [items]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            {type === 'out' ? 'Adicionar itens à saída' : 'Selecionar itens devolvidos'}
          </h3>
          <p className="text-sm text-slate-500">
            Colaborador: <strong>{staff.full_name}</strong>
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addProduct(code);
        }}
        className="flex gap-2"
      >
        <Input
          ref={inputRef}
          placeholder="Escaneie ou digite o SKU"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-12 text-base"
          autoComplete="off"
        />
        <Button type="button" variant="outline" className="h-12 px-4" onClick={() => setScannerOpen(true)}>
          <ScanLine />
        </Button>
        <Button type="button" variant="outline" className="h-12 px-4" onClick={() => setSearchOpen((v) => !v)}>
          <Search />
        </Button>
      </form>

      {searchOpen && (
        <Card className="p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            />
            <Button onClick={doSearch}>Buscar</Button>
          </div>
          <div className="max-h-48 overflow-auto divide-y">
            {searchResults.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left p-2 hover:bg-slate-50 text-sm"
                onClick={() => {
                  addProduct(p.id, true);
                  setSearchOpen(false);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
              >
                <p className="font-semibold line-clamp-2">{p.name}</p>
                <p className="text-xs text-slate-500">
                  SKU {p.sku || '-'} · estoque {p.current_stock ?? 0}
                </p>
              </button>
            ))}
            {searchResults.length === 0 && (
              <p className="text-xs text-slate-400 p-2">Nenhum resultado.</p>
            )}
          </div>
        </Card>
      )}

      {loadingBalance && type === 'return' && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> Carregando itens em posse...
        </p>
      )}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <Package className="mx-auto mb-2" />
            <p className="text-sm">Nenhum item adicionado.</p>
          </div>
        ) : (
          items.map((i, idx) => (
            <Card key={i.productId} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 line-clamp-2">{i.name}</p>
                <p className="text-xs text-slate-500">
                  SKU {i.sku || '-'} · {type === 'return' ? 'em posse' : 'disponível'}: {i.available}
                </p>
              </div>
              <Input
                type="number"
                min={1}
                max={i.available}
                value={i.quantity}
                onChange={(e) => {
                  const q = Math.max(1, Math.min(i.available, Number(e.target.value) || 1));
                  setItems((prev) => prev.map((it, j) => (j === idx ? { ...it, quantity: q } : it)));
                }}
                className="w-20 h-10 text-center"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== idx))}
              >
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button disabled={!canContinue} onClick={() => onContinue(items)} className="h-11 px-6">
          Continuar para assinatura
        </Button>
      </div>

      {scannerOpen && (
        <QrScanner
          onResult={(v) => {
            setScannerOpen(false);
            addProduct(v);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
};
