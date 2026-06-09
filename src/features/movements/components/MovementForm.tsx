import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserName } from '@/hooks/useCurrentUserName';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  ArrowLeft,
  ScanLine,
  Search,
  Trash2,
  Plus,
  Minus,
  Eraser,
  Loader2,
  CheckCircle2,
  User,
  Package,
  HardHat,
  Wrench,
  ArrowUpFromLine,
  ArrowDownToLine,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { QrScanner } from './QrScanner';
import {
  findProductByCode,
  searchProductsByName,
  searchStaff,
  type ProductHit,
  type StaffHit,
} from '../lib/findProduct';
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';

type Kind = 'epi' | 'tool';
type MoveType = 'out' | 'return';

interface Line {
  productId: string;
  name: string;
  code: string;
  ca: string | null;
  quantity: number;
  warehouseId: string;
  available: number;
  isTool: boolean;
}

interface Props {
  kind: Kind;
  type: MoveType;
  onDone?: () => void;
  embedded?: boolean;
}

type Suggestion =
  | { kind: 'staff'; data: StaffHit }
  | { kind: 'product'; data: ProductHit };

export const MovementForm = ({ kind, type, onDone, embedded = false }: Props) => {
  const navigate = useNavigate();
  const finish = () => (onDone ? onDone() : navigate({ to: '/movements' }));

  const isOut = type === 'out';
  const accent = isOut ? 'blue' : 'emerald';
  const accentBg = isOut ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';
  const accentPill = isOut
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  // -- state --
  const [staff, setStaff] = useState<StaffHit | null>(null);
  const [items, setItems] = useState<Line[]>([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [balance, setBalance] = useState<Map<string, number>>(new Map());
  const [inPossession, setInPossession] = useState<
    Array<{ productId: string; name: string; ca: string | null; qty: number; warehouseId: string; isTool: boolean }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const registeredBy = useCurrentUserName();
  const { warehouseFilter } = useWarehouseFilterStore();
  const warehouseScope = warehouseFilter !== 'all' ? warehouseFilter : undefined;


  const inputRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<SignatureCanvas>(null);

  // auto-focus on mount + after state changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [staff, items.length]);

  // -- possession load (for returns) --
  useEffect(() => {
    if (!staff || type !== 'return') {
      setInPossession([]);
      setBalance(new Map());
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('transactions')
        .select(
          'product_id, type, quantity, products(name, ca_number, warehouse_id, categories(type))'
        )
        .eq('staff_id', staff.id)
        .in('type', ['out', 'return']);
      const m = new Map<string, number>();
      const meta = new Map<
        string,
        { name: string; ca: string | null; warehouseId: string; isTool: boolean }
      >();
      for (const t of data || []) {
        if (!t.product_id) continue;
        m.set(t.product_id, (m.get(t.product_id) || 0) + (t.type === 'out' ? t.quantity : -t.quantity));
        const p: any = (t as any).products;
        if (p)
          meta.set(t.product_id, {
            name: p.name,
            ca: p.ca_number,
            warehouseId: p.warehouse_id,
            isTool: p.categories?.type === 'tool',
          });
      }
      setBalance(m);
      const pos: typeof inPossession = [];
      for (const [pid, qty] of m.entries()) {
        if (qty > 0) {
          const md = meta.get(pid);
          if (md) pos.push({ productId: pid, name: md.name, ca: md.ca, qty, warehouseId: md.warehouseId, isTool: md.isTool });
        }
      }
      setInPossession(pos);
    })();
  }, [staff, type]);

  // -- live suggestions --
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const h = setTimeout(async () => {
      const [s, p] = await Promise.all([
        staff ? Promise.resolve<StaffHit[]>([]) : searchStaff(q),
        searchProductsByName(q, kind, warehouseScope),
      ]);
      const merged: Suggestion[] = [
        ...s.map((x) => ({ kind: 'staff' as const, data: x })),
        ...p.slice(0, 6).map((x) => ({ kind: 'product' as const, data: x })),
      ];
      setSuggestions(merged);
      setSearching(false);
    }, 200);
    return () => clearTimeout(h);
  }, [query, kind, staff, warehouseScope]);

  // -- add product --
  const addProduct = (hit: ProductHit) => {
    if (!staff) {
      toast.error('Identifique o colaborador primeiro');
      return;
    }
    if (!warehouseScope) {
      toast.error('Selecione um almoxarifado no menu lateral antes de adicionar itens.');
      return;
    }
    if (hit.warehouse_id !== warehouseScope) {
      toast.error('Este item pertence a outro almoxarifado. Troque o almoxarifado no menu lateral.');
      return;
    }
    if (type === 'return' && (balance.get(hit.id) || 0) <= 0) {
      toast.error('Colaborador não possui este item');
      return;
    }
    const isTool = hit.category_type === 'tool';
    const maxAvail = type === 'return' ? balance.get(hit.id) || 0 : hit.current_stock ?? 0;
    if (maxAvail <= 0) {
      toast.error('Sem estoque disponível');
      return;
    }

    setItems((prev) => {
      const i = prev.findIndex((l) => l.productId === hit.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: Math.min(next[i].quantity + 1, maxAvail) };
        return next;
      }
      return [
        ...prev,
        {
          productId: hit.id,
          name: hit.name,
          code: hit.sku || hit.item_number || hit.ca_number || '',
          ca: hit.ca_number,
          quantity: 1,
          warehouseId: hit.warehouse_id,
          available: maxAvail,
          isTool,
        },
      ];
    });
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };


  // -- submit query (Enter or scanner result) --
  const submitQuery = async (raw: string) => {
    const v = raw.trim();
    if (!v) return;

    // priority 1: first suggestion if available
    const first = suggestions[0];
    if (first) {
      if (first.kind === 'staff') {
        setStaff(first.data);
        setQuery('');
        setSuggestions([]);
        return;
      }
      addProduct(first.data);
      return;
    }

    // priority 2: staff exact match by registration_number (numeric or alphanumeric)
    if (!staff) {
      const { data: st } = await supabase
        .from('staff')
        .select('id, full_name, registration_number, role')
        .eq('registration_number', v)
        .maybeSingle();
      if (st) {
        setStaff(st as StaffHit);
        setQuery('');
        return;
      }
    }

    // priority 3: product by exact code (cascading)
    const res = await findProductByCode(v, kind, warehouseScope);
    if (res.wrongKind) {
      toast.error(
        `Código "${v}" pertence a ${res.matchedKind === 'tool' ? 'Ferramenta' : 'EPI'}. Troque o modo no topo da tela.`
      );
      return;
    }
    if (res.hit) {
      addProduct(res.hit);
      return;
    }

    toast.error(`Nada encontrado para "${v}"`);
  };


  const updateQty = (idx: number, q: number) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, Math.min(it.available, q)) } : it))
    );

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit = useMemo(
    () => !!staff && items.length > 0 && items.every((i) => i.quantity > 0 && i.quantity <= i.available),
    [staff, items]
  );

  const submit = async () => {
    if (!staff) return toast.error('Identifique o colaborador');
    if (items.length === 0) return toast.error('Adicione pelo menos um item');
    if (!registeredBy.trim()) return toast.error(isOut ? 'Informe quem está registrando a saída' : 'Informe quem está registrando a devolução');
    if (sigRef.current?.isEmpty()) return toast.error('Assinatura obrigatória');
    setSubmitting(true);
    try {
      const dataUrl = sigRef.current!.getTrimmedCanvas().toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const groupId = crypto.randomUUID();
      const path = `${staff.id}/${groupId}.png`;
      const { error: upErr } = await supabase.storage
        .from('signatures')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (upErr) throw upErr;

      const { data: userRes } = await supabase.auth.getUser();
      const clerkId = userRes.user?.id ?? null;

      const rows = items.map((i) => ({
        type,
        product_id: i.productId,
        staff_id: staff.id,
        warehouse_id: i.warehouseId,
        quantity: i.quantity,
        clerk_id: clerkId,
        status: 'completed',
        signature_url: path,
        movement_group_id: groupId,
        material_kind: i.isTool ? 'tool' : 'epi',
        notes: isOut ? 'Saída de material' : 'Devolução de material',
        registered_by: registeredBy.trim(),
      }));
      const { error: insErr } = await supabase.from('transactions').insert(rows as any);
      if (insErr) throw insErr;

      // Atomic stock adjustments via RPC (prevents race conditions)
      await Promise.all(
        items.map((i) => {
          const delta = isOut ? -i.quantity : i.quantity;
          return supabase.rpc('adjust_stock' as any, {
            p_product_id: i.productId,
            p_delta: delta,
          });
        })
      );


      toast.success(isOut ? 'Saída registrada' : 'Devolução registrada');
      finish();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao registrar');
    } finally {
      setSubmitting(false);
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuery('');
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit && !submitting) {
        submit();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [canSubmit, submitting]);


  return (
    <div className={embedded ? 'pb-32' : 'max-w-xl mx-auto pb-32 px-3 sm:px-0 pt-4'}>
      {!embedded && (
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={finish}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <Pill
            value={type}
            onChange={() => {}}
            disabled
            isOut={isOut}
          />
        </div>
      )}

      {!warehouseScope && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Selecione um almoxarifado no menu lateral.</p>
          <p className="text-xs text-amber-800 mt-0.5">
            A movimentação só pode ser feita dentro do almoxarifado onde o item está cadastrado.
          </p>
        </div>
      )}


      {/* Universal input */}
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuery(query);
          }}
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                staff
                  ? 'Bipe ou digite SKU, CA ou nome do item'
                  : 'Bipe matrícula, SKU, CA ou nome'
              }
              className="h-14 pl-12 pr-14 text-base rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-0"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Escanear QR / código de barras"
            >
              <ScanLine size={18} />
            </button>
          </div>
        </form>

        {/* suggestions */}
        {(suggestions.length > 0 || searching) && (
          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            {searching && suggestions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Buscando…
              </div>
            ) : (
              <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((s, idx) => (
                  <SuggestionRow
                    key={`${s.kind}-${s.kind === 'staff' ? s.data.id : s.data.id}-${idx}`}
                    s={s}
                    onClick={() => {
                      if (s.kind === 'staff') {
                        setStaff(s.data);
                        setQuery('');
                        setSuggestions([]);
                      } else addProduct(s.data);
                    }}
                    requestedKind={kind}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Helper hint */}
      {!staff && items.length === 0 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          Comece bipando a matrícula do colaborador.
        </p>
      )}

      {/* Colaborador */}
      {staff && (
        <section className="mt-6">
          <SectionLabel>Colaborador</SectionLabel>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
            <div className={`w-10 h-10 rounded-xl bg-${accent}-100 text-${accent}-700 flex items-center justify-center`}>
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 truncate">{staff.full_name}</p>
              <p className="text-xs text-slate-500 truncate">
                mat. {staff.registration_number}
                {staff.role && ` · ${staff.role}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStaff(null);
                setItems([]);
              }}
            >
              Trocar
            </Button>
          </div>
        </section>
      )}

      {/* Em posse (devolução) */}
      {type === 'return' && staff && inPossession.length > 0 && (
        <section className="mt-5">
          <SectionLabel>
            Em posse ({inPossession.length})
          </SectionLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {inPossession.map((p) => {
              const already = items.some((i) => i.productId === p.productId);
              return (
                <button
                  key={p.productId}
                  type="button"
                  disabled={already}
                  onClick={() =>
                    addProduct({
                      id: p.productId,
                      name: p.name,
                      sku: null,
                      item_number: null,
                      ca_number: p.ca,
                      current_stock: p.qty,
                      warehouse_id: p.warehouseId,
                      category_type: p.isTool ? 'tool' : 'epi',
                      category_name: null,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                    already
                      ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <Plus size={12} />
                  <span className="max-w-[180px] truncate">{p.name}</span>
                  <span className="text-emerald-500">×{p.qty}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Itens - lista única separada por categoria */}
      {items.length > 0 && (
        <section className="mt-5">
          <SectionLabel>
            Materiais Selecionados ({items.length})
          </SectionLabel>
          <div className="mt-2 space-y-4">
            {(['epi', 'tool'] as const).map((group) => {
              const groupItems = items
                .map((it, idx) => ({ it, idx }))
                .filter(({ it }) => (group === 'tool' ? it.isTool : !it.isTool));
              if (groupItems.length === 0) return null;
              const isTool = group === 'tool';
              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isTool
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isTool ? <Wrench size={11} /> : <HardHat size={11} />}
                      {isTool ? 'Ferramentas' : 'EPIs'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {groupItems.length}
                    </span>
                    <span className="flex-1 h-px bg-slate-100" />
                  </div>
                  <ul className="space-y-2">
                    {groupItems.map(({ it: i, idx }) => (
                      <li
                        key={i.productId}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            i.isTool ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {i.isTool ? <Wrench size={16} /> : <HardHat size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 line-clamp-1">{i.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {i.code && <span className="font-mono">{i.code}</span>}
                            {i.ca && <span> · CA {i.ca}</span>}
                            <span> · {type === 'return' ? 'em posse' : 'estoque'} {i.available}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconBtn onClick={() => updateQty(idx, i.quantity - 1)}>
                            <Minus size={13} />
                          </IconBtn>
                          <span className="w-7 text-center font-black text-slate-900">{i.quantity}</span>
                          <IconBtn onClick={() => updateQty(idx, i.quantity + 1)}>
                            <Plus size={13} />
                          </IconBtn>
                          <IconBtn onClick={() => removeItem(idx)} danger>
                            <Trash2 size={13} />
                          </IconBtn>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}


      {/* Assinatura */}
      {items.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <SectionLabel>Assinatura</SectionLabel>
            <button
              onClick={() => sigRef.current?.clear()}
              className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <Eraser size={12} /> Limpar
            </button>
          </div>
          <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white overflow-hidden">
            <SignatureCanvas
              ref={sigRef}
              penColor="#0f172a"
              canvasProps={{ className: 'w-full h-44 touch-none' }}
            />
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User size={11} /> Responsável pelo registro
            </label>
            <p className="mt-1.5 h-12 rounded-2xl border border-slate-200 bg-slate-50 text-sm flex items-center px-4 text-slate-800 font-semibold">
              {registeredBy || 'Carregando...'}
            </p>
          </div>
        </section>
      )}


      {/* Sticky confirm */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="flex-1 text-sm min-w-0">
            {staff ? (
              <span className="text-slate-700 truncate block">
                <strong>{staff.full_name}</strong> · {items.length}{' '}
                {items.length === 1 ? 'item' : 'itens'}
              </span>
            ) : (
              <span className="text-slate-400">Bipe a matrícula para começar</span>
            )}
          </div>
          <Button
            onClick={() => {
              if (!canSubmit) {
                if (!staff) return toast.error('Identifique o colaborador');
                if (items.length === 0) return toast.error('Adicione pelo menos um item');
                return;
              }
              if (sigRef.current?.isEmpty()) return toast.error('Assinatura obrigatória');
              setConfirmOpen(true);
            }}
            disabled={!canSubmit || submitting}
            className={`h-12 px-5 rounded-2xl text-sm font-black ${accentBg}`}
          >
            <CheckCircle2 className="mr-2" size={16} />
            Confirmar {isOut ? 'Retirada' : 'Devolução'}
          </Button>

        </div>
      </div>

      {scannerOpen && (
        <QrScanner
          onResult={(v) => {
            setScannerOpen(false);
            submitQuery(v);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Summary confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !submitting && setConfirmOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              Resumo da {isOut ? 'Retirada' : 'Devolução'}
            </DialogTitle>
          </DialogHeader>

          {staff && (
            <div className="rounded-2xl bg-slate-50 p-3 text-sm">
              <p className="font-bold text-slate-900">{staff.full_name}</p>
              <p className="text-xs text-slate-500">
                mat. {staff.registration_number}
                {staff.role && ` · ${staff.role}`}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {new Date().toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-3">
            {(['epi', 'tool'] as const).map((g) => {
              const list = items.filter((i) => (g === 'tool' ? i.isTool : !i.isTool));
              if (list.length === 0) return null;
              return (
                <div key={g}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    {g === 'tool' ? 'Ferramentas' : 'EPIs'} ({list.length})
                  </p>
                  <ul className="space-y-1">
                    {list.map((i) => (
                      <li
                        key={i.productId}
                        className="flex items-center justify-between text-sm border-b border-slate-100 py-1.5 last:border-0"
                      >
                        <span className="truncate text-slate-700">{i.name}</span>
                        <span className="font-black text-slate-900 tabular-nums shrink-0 ml-2">
                          ×{i.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                await submit();
                setConfirmOpen(false);
              }}
              disabled={submitting}
              className={`flex-1 font-black ${accentBg}`}
            >
              {submitting ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <CheckCircle2 className="mr-2" size={16} />
              )}
              Confirmar {isOut ? 'Retirada' : 'Devolução'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// ---------- subcomponents ----------

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </span>
    <span className="flex-1 h-px bg-slate-100" />
  </div>
);

const IconBtn = ({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
      danger
        ? 'text-red-500 hover:bg-red-50'
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);

const Pill = ({
  value,
  isOut,
}: {
  value: MoveType;
  onChange: (v: MoveType) => void;
  disabled?: boolean;
  isOut: boolean;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
      isOut
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }`}
  >
    {isOut ? <ArrowUpFromLine size={12} /> : <ArrowDownToLine size={12} />}
    {isOut ? 'Saída' : 'Devolução'}
  </span>
);

const SuggestionRow = ({
  s,
  onClick,
  requestedKind,
}: {
  s: Suggestion;
  onClick: () => void;
  requestedKind: Kind;
}) => {
  if (s.kind === 'staff') {
    return (
      <li>
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <User size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{s.data.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              mat. {s.data.registration_number}
              {s.data.role && ` · ${s.data.role}`}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] rounded-full">
            Colaborador
          </Badge>
        </button>
      </li>
    );
  }
  const p = s.data;
  const isTool = p.category_type === 'tool';
  const wrong = (isTool && requestedKind !== 'tool') || (!isTool && requestedKind === 'tool');
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isTool ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
          }`}
        >
          {isTool ? <Wrench size={15} /> : <HardHat size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{p.name}</p>
          <p className="text-[11px] text-slate-500 truncate">
            {p.sku && <span className="font-mono">SKU {p.sku}</span>}
            {p.ca_number && <span> · CA {p.ca_number}</span>}
            <span> · est. {p.current_stock ?? 0}</span>
          </p>
        </div>
        {wrong && (
          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
            {isTool ? 'Ferr.' : 'EPI'}
          </span>
        )}
      </button>
    </li>
  );
};
