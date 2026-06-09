import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserName } from '@/hooks/useCurrentUserName';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ScanLine,
  Search,
  Trash2,
  Plus,
  Minus,
  Eraser,
  Loader2,
  CheckCircle2,
  User,
  HardHat,
  Wrench,
  Check,
  Pencil,
  History,
  Sparkles,
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
import { useIsMobile } from '@/hooks/use-mobile';



type Kind = 'epi' | 'tool';

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

type StepNum = 1 | 2 | 3;

export const ExitWizard = () => {
  const navigate = useNavigate();

  // -- state --
  const [staff, setStaff] = useState<StaffHit | null>(null);
  const [items, setItems] = useState<Line[]>([]);
  const [kind, setKind] = useState<Kind>('epi');
  const [query, setQuery] = useState('');
  const [productSuggest, setProductSuggest] = useState<ProductHit[]>([]);
  const [staffSuggest, setStaffSuggest] = useState<StaffHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dialogStage, setDialogStage] = useState<'summary' | 'sign' | 'success'>('summary');
  const registeredBy = useCurrentUserName();
  const { warehouseFilter } = useWarehouseFilterStore();
  const warehouseScope = warehouseFilter !== 'all' ? warehouseFilter : undefined;
  const isMobile = useIsMobile();


  // intelligent context
  const [recentStaff, setRecentStaff] = useState<StaffHit[]>([]);
  const [recentItems, setRecentItems] = useState<ProductHit[]>([]);
  const [roleItems, setRoleItems] = useState<ProductHit[]>([]);

  const staffInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<SignatureCanvas>(null);

  const step: StepNum = !staff ? 1 : items.length === 0 ? 2 : 3;

  // -- focus per step (skip on mobile to avoid auto-opening the keyboard) --
  useEffect(() => {
    if (isMobile) return;
    if (step === 1) staffInputRef.current?.focus();
    if (step === 2 || step === 3) itemInputRef.current?.focus();
  }, [step, isMobile]);


  // -- load "atendidos hoje" (filtered by selected warehouse) --
  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      let q = supabase
        .from('transactions')
        .select('staff_id, created_at, warehouse_id, staff(id, full_name, registration_number, role)')
        .eq('type', 'out')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      if (warehouseScope) q = q.eq('warehouse_id', warehouseScope);
      const { data } = await q;
      const seen = new Set<string>();
      const list: StaffHit[] = [];
      for (const r of (data || []) as any[]) {
        const s = r.staff;
        if (!s || seen.has(s.id)) continue;
        seen.add(s.id);
        list.push(s);
        if (list.length >= 4) break;
      }
      setRecentStaff(list);
    })();
  }, [warehouseScope]);


  // -- load smart product suggestions for selected staff --
  useEffect(() => {
    if (!staff) {
      setRecentItems([]);
      setRoleItems([]);
      return;
    }
    (async () => {
      // últimas retiradas deste colaborador
      const { data: lastTx } = await supabase
        .from('transactions')
        .select('product_id, created_at, products(id, name, sku, item_number, ca_number, current_stock, warehouse_id, categories(type, name))')
        .eq('staff_id', staff.id)
        .eq('type', 'out')
        .order('created_at', { ascending: false })
        .limit(20);
      const seen = new Set<string>();
      const recent: ProductHit[] = [];
      for (const r of (lastTx || []) as any[]) {
        if (!r.product_id || seen.has(r.product_id)) continue;
        seen.add(r.product_id);
        const p = r.products;
        if (!p) continue;
        recent.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          item_number: p.item_number,
          ca_number: p.ca_number,
          current_stock: p.current_stock,
          warehouse_id: p.warehouse_id,
          category_type: p.categories?.type ?? null,
          category_name: p.categories?.name ?? null,
        });
        if (recent.length >= 4) break;
      }
      setRecentItems(recent);

      // mais usados pela função do colaborador (últimos 60 dias)
      if (staff.role) {
        const since = new Date();
        since.setDate(since.getDate() - 60);
        const { data: roleTx } = await supabase
          .from('transactions')
          .select('product_id, staff!inner(role), products(id, name, sku, item_number, ca_number, current_stock, warehouse_id, categories(type, name))')
          .eq('type', 'out')
          .eq('staff.role', staff.role)
          .gte('created_at', since.toISOString())
          .limit(200);
        const count = new Map<string, { hit: ProductHit; n: number }>();
        for (const r of (roleTx || []) as any[]) {
          if (!r.product_id || !r.products) continue;
          const p = r.products;
          const cur = count.get(r.product_id);
          if (cur) cur.n++;
          else
            count.set(r.product_id, {
              n: 1,
              hit: {
                id: p.id,
                name: p.name,
                sku: p.sku,
                item_number: p.item_number,
                ca_number: p.ca_number,
                current_stock: p.current_stock,
                warehouse_id: p.warehouse_id,
                category_type: p.categories?.type ?? null,
                category_name: p.categories?.name ?? null,
              },
            });
        }
        const top = [...count.values()]
          .sort((a, b) => b.n - a.n)
          .slice(0, 4)
          .map((x) => x.hit);
        setRoleItems(top);
      }
    })();
  }, [staff]);

  // -- live search --
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setProductSuggest([]);
      setStaffSuggest([]);
      return;
    }
    setSearching(true);
    const h = setTimeout(async () => {
      if (!staff) {
        const s = await searchStaff(q);
        setStaffSuggest(s);
        setProductSuggest([]);
      } else {
        const p = await searchProductsByName(q, kind, warehouseScope);
        setProductSuggest(p.slice(0, 8));
        setStaffSuggest([]);
      }
      setSearching(false);
    }, 200);
    return () => clearTimeout(h);
  }, [query, staff, kind, warehouseScope]);

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
      toast.error('Este item pertence a outro almoxarifado. Troque o almoxarifado no menu lateral para retirá-lo.');
      return;
    }
    const isTool = hit.category_type === 'tool';
    const productKind: Kind = isTool ? 'tool' : 'epi';
    // Strict separation: do NOT auto-switch. EPIs and Ferramentas
    // podem compartilhar código, então o usuário precisa estar no
    // modo certo antes de adicionar.
    if (productKind !== kind) {
      toast.error(
        `"${hit.name}" é ${isTool ? 'Ferramenta' : 'EPI'}. Troque o modo acima para adicioná-lo.`
      );
      return;
    }

    const maxAvail = hit.current_stock ?? 0;
    if (maxAvail <= 0) {
      toast.error(`${hit.name} — sem estoque`);
      return;
    }

    setItems((prev) => {
      const i = prev.findIndex((l) => l.productId === hit.id);
      if (i >= 0) {
        const next = [...prev];
        const nq = Math.min(next[i].quantity + 1, maxAvail);
        if (nq === next[i].quantity)
          toast.warning(`${hit.name} — só restam ${maxAvail} em estoque`);
        next[i] = { ...next[i], quantity: nq };
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
    setProductSuggest([]);
    if (!isMobile) itemInputRef.current?.focus();
  };



  // -- submit query --
  const submitQuery = async (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (!staff) {
      const first = staffSuggest[0];
      if (first) {
        setStaff(first);
        setQuery('');
        setStaffSuggest([]);
        return;
      }
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
      toast.error(`Colaborador não encontrado para "${v}"`);
      return;
    }
    const first = productSuggest[0];
    if (first) {
      addProduct(first);
      return;
    }
    const res = await findProductByCode(v, kind, warehouseScope);
    if (res.hit) {
      addProduct(res.hit);
      return;
    }
    if (res.wrongKind) {
      toast.error(
        `Código "${v}" pertence a ${res.matchedKind === 'tool' ? 'Ferramenta' : 'EPI'}. Troque o modo acima.`
      );
      return;
    }
    toast.error(`Nada encontrado para "${v}" em ${kind === 'tool' ? 'Ferramentas' : 'EPIs'}`);
  };



  const updateQty = (idx: number, q: number) =>
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, quantity: Math.max(1, Math.min(it.available, q)) } : it
      )
    );
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const totalUnits = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const canSubmit = useMemo(
    () => !!staff && items.length > 0 && items.every((i) => i.quantity > 0 && i.quantity <= i.available),
    [staff, items]
  );

  const submit = async (): Promise<boolean> => {
    if (!staff) { toast.error('Identifique o colaborador'); return false; }
    if (items.length === 0) { toast.error('Adicione pelo menos um item'); return false; }
    if (!registeredBy.trim()) { toast.error('Informe quem está registrando a saída'); return false; }
    if (sigRef.current?.isEmpty()) { toast.error('Assinatura obrigatória'); return false; }
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
        type: 'out',
        product_id: i.productId,
        staff_id: staff.id,
        warehouse_id: i.warehouseId,
        quantity: i.quantity,
        clerk_id: clerkId,
        status: 'completed',
        signature_url: path,
        movement_group_id: groupId,
        material_kind: i.isTool ? 'tool' : 'epi',
        notes: 'Saída de material',
        registered_by: registeredBy.trim(),
      }));
      const { error: insErr } = await supabase.from('transactions').insert(rows as any);
      if (insErr) throw insErr;

      // Atomic stock decrement via RPC (prevents race conditions)
      await Promise.all(
        items.map((i) =>
          supabase.rpc('adjust_stock' as any, {
            p_product_id: i.productId,
            p_delta: -i.quantity,
          })
        )
      );


      return true;
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao registrar');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const resetForNewExit = () => {
    setStaff(null);
    setItems([]);
    setQuery('');
    setProductSuggest([]);
    setStaffSuggest([]);
    setConfirmOpen(false);
    setDialogStage('summary');
    sigRef.current?.clear();
  };


  // shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuery('');
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit && !submitting) {
        setConfirmOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [canSubmit, submitting]);


  return (
    <div className="pb-32">
      {/* Stepper */}
      <Stepper step={step} />

      {!warehouseScope && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Selecione um almoxarifado no menu lateral.</p>
          <p className="text-xs text-amber-800 mt-0.5">
            A saída só pode ser feita dentro do almoxarifado onde o item está cadastrado.
          </p>
        </div>
      )}






      {/* STEP 1 — Colaborador */}
      <StepCard
        n={1}
        title="Quem está retirando?"
        active={step === 1}
        done={!!staff}
        compact={
          staff && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
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
                  setQuery('');
                }}
              >
                <Pencil size={14} className="mr-1" /> Trocar
              </Button>
            </div>
          )
        }
      >
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
              ref={staffInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bipe a matrícula ou digite o nome"
              className="h-14 pl-12 pr-14 text-base rounded-2xl border-slate-200 bg-white shadow-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              title="Escanear crachá"
            >
              <ScanLine size={18} />
            </button>
          </div>
        </form>

        {staffSuggest.length > 0 && (
          <ul className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
            {staffSuggest.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setStaff(s);
                    setQuery('');
                    setStaffSuggest([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <User size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {s.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      mat. {s.registration_number}
                      {s.role && ` · ${s.role}`}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {recentStaff.length > 0 && staffSuggest.length === 0 && (
          <div className="mt-4">
            <SmartLabel icon={<History size={11} />}>Atendidos hoje</SmartLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {recentStaff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStaff(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-semibold text-slate-700 transition"
                >
                  <User size={12} />
                  {s.full_name.split(' ')[0]}
                  <span className="text-slate-400 font-mono">{s.registration_number}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </StepCard>

      {/* STEP 2 — Itens */}
      <StepCard
        n={2}
        title="O que vai sair?"
        active={step === 2 || (step === 3 && items.length > 0)}
        done={items.length > 0 && step === 3}
        disabled={!staff}
        meta={
          items.length > 0 && (
            <span className="text-xs font-bold text-slate-500">
              {items.length} {items.length === 1 ? 'item' : 'itens'} · {totalUnits}{' '}
              {totalUnits === 1 ? 'un' : 'un'}
            </span>
          )
        }
      >
        {/* Kind segment — auto-detected pelo código do produto */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-slate-100">
            {(['epi', 'tool'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  kind === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {k === 'tool' ? <Wrench size={12} /> : <HardHat size={12} />}
                {k === 'tool' ? 'Ferramenta' : 'EPI'}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Selecione o tipo antes de buscar
          </span>

        </div>


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
              ref={itemInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!staff}
              placeholder="Bipe ou digite SKU, CA ou nome do item"
              className="h-14 pl-12 pr-14 text-base rounded-2xl border-slate-200 bg-white shadow-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              disabled={!staff}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
            >
              <ScanLine size={18} />
            </button>
          </div>
        </form>

        {(productSuggest.length > 0 || searching) && (
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {searching && productSuggest.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Buscando…
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {productSuggest.map((p) => {
                  const isTool = p.category_type === 'tool';
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => addProduct(p)}
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
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {p.sku && <span className="font-mono">SKU {p.sku}</span>}
                            {p.ca_number && <span> · CA {p.ca_number}</span>}
                            <span> · est. {p.current_stock ?? 0}</span>
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Smart suggestions */}
        {staff && query.trim().length < 2 && (
          <div className="mt-4 space-y-4">
            {roleItems.length > 0 && (
              <div>
                <SmartLabel icon={<Sparkles size={11} />}>
                  Mais usados em {staff.role}
                </SmartLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roleItems.map((p) => (
                    <ChipItem key={p.id} hit={p} onAdd={() => addProduct(p)} />
                  ))}
                </div>
              </div>
            )}
            {recentItems.length > 0 && (
              <div>
                <SmartLabel icon={<History size={11} />}>Retirou recentemente</SmartLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recentItems.map((p) => (
                    <ChipItem key={p.id} hit={p} onAdd={() => addProduct(p)} />
                  ))}
                </div>
              </div>
            )}
            {roleItems.length === 0 && recentItems.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">
                Bipe o código ou digite o nome do item.
              </p>
            )}
          </div>
        )}

        {/* Lista agrupada */}
        {items.length > 0 && (
          <div className="mt-5 space-y-4">
            {(['epi', 'tool'] as const).map((g) => {
              const list = items
                .map((it, idx) => ({ it, idx }))
                .filter(({ it }) => (g === 'tool' ? it.isTool : !it.isTool));
              if (list.length === 0) return null;
              const isTool = g === 'tool';
              return (
                <div key={g}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isTool ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isTool ? <Wrench size={11} /> : <HardHat size={11} />}
                      {isTool ? 'Ferramentas' : 'EPIs'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{list.length}</span>
                    <span className="flex-1 h-px bg-slate-100" />
                  </div>
                  <ul className="space-y-2">
                    {list.map(({ it: i, idx }) => (
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
                          <p className="font-semibold text-sm text-slate-900 line-clamp-1">
                            {i.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {i.code && <span className="font-mono">{i.code}</span>}
                            {i.ca && <span> · CA {i.ca}</span>}
                            <span> · {i.available} em estoque</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconBtn onClick={() => updateQty(idx, i.quantity - 1)}>
                            <Minus size={13} />
                          </IconBtn>
                          <span className="w-7 text-center font-black text-slate-900">
                            {i.quantity}
                          </span>
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
        )}
      </StepCard>

      {/* STEP 3 — Revisão (assinatura acontece ao confirmar) */}
      <StepCard
        n={3}
        title="Revisar e confirmar"
        active={step === 3}
        disabled={items.length === 0}
      >
        <p className="text-sm text-slate-600">
          Confira os itens acima. Ao tocar em <strong>Confirmar Saída</strong> você passará pela assinatura do colaborador antes do registro.
        </p>
        <div className="mt-3">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User size={11} /> Responsável pelo registro
          </label>
          <p className="mt-1.5 h-12 rounded-2xl border border-slate-200 bg-slate-50 text-sm flex items-center px-4 text-slate-800 font-semibold">
            {registeredBy || 'Carregando...'}
          </p>
        </div>
      </StepCard>


      {/* Sticky confirm */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 text-sm min-w-0">
            {staff ? (
              <span className="text-slate-700 truncate block">
                <strong>{staff.full_name}</strong> · {items.length}{' '}
                {items.length === 1 ? 'item' : 'itens'} · {totalUnits} un
              </span>
            ) : (
              <span className="text-slate-400">Identifique o colaborador para começar</span>
            )}
          </div>
          <Button
            onClick={() => {
              if (!canSubmit) {
                if (!staff) return toast.error('Identifique o colaborador');
                if (items.length === 0) return toast.error('Adicione pelo menos um item');
                return;
              }
              setDialogStage('summary');
              setConfirmOpen(true);
            }}
            disabled={!canSubmit || submitting}
            className="h-12 px-5 rounded-2xl text-sm font-black bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle2 className="mr-2" size={16} />
            Confirmar Saída
          </Button>

        </div>
      </div>

      {/* Floating scan FAB */}
      {staff && (
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="md:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 flex items-center justify-center active:scale-95 transition"
          title="Escanear"
        >
          <ScanLine size={22} />
        </button>
      )}

      {scannerOpen && (
        <QrScanner
          onResult={(v) => {
            setScannerOpen(false);
            submitQuery(v);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (submitting) return;
          if (dialogStage === 'success' && !o) {
            // fechar pelo X após sucesso → reseta para nova saída
            resetForNewExit();
            return;
          }
          setConfirmOpen(o);
        }}
      >
        <DialogContent className="max-w-md">
          {dialogStage === 'summary' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Resumo da Saída</DialogTitle>
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
                  className="flex-1"
                >
                  Voltar e revisar
                </Button>
                <Button
                  onClick={() => setDialogStage('sign')}
                  className="flex-1 font-black bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="mr-2" size={16} />
                  Confirmar
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogStage === 'sign' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Assinatura do colaborador</DialogTitle>
              </DialogHeader>

              <p className="text-sm text-slate-500">
                {staff?.full_name} assina abaixo para confirmar o recebimento.
              </p>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => sigRef.current?.clear()}
                  className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <Eraser size={12} /> Limpar
                </button>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white overflow-hidden">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#0f172a"
                  canvasProps={{ className: 'w-full h-44 touch-none' }}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogStage('summary')}
                  disabled={submitting}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={async () => {
                    const ok = await submit();
                    if (ok) setDialogStage('success');
                  }}
                  disabled={submitting}
                  className="flex-1 font-black bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <CheckCircle2 className="mr-2" size={16} />
                  )}
                  Confirmar e registrar
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogStage === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={22} /> Item registrado
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-600">
                A saída foi registrada com sucesso. O que deseja fazer agora?
              </p>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/movements' })}
                  className="flex-1"
                >
                  Tela inicial
                </Button>
                <Button
                  onClick={resetForNewExit}
                  className="flex-1 font-black bg-blue-600 hover:bg-blue-700"
                >
                  Iniciar nova saída
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

// ---------- subcomponents ----------

const Stepper = ({ step }: { step: StepNum }) => (
  <div className="flex items-center gap-2 mb-5">
    {([1, 2, 3] as const).map((n) => {
      const active = n === step;
      const done = n < step;
      return (
        <div key={n} className="flex items-center flex-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
              done
                ? 'bg-blue-600 text-white'
                : active
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {done ? <Check size={14} /> : n}
          </div>
          {n < 3 && (
            <div
              className={`flex-1 h-0.5 mx-2 rounded ${n < step ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          )}
        </div>
      );
    })}
  </div>
);

const StepCard = ({
  n,
  title,
  active,
  done,
  disabled,
  children,
  compact,
  meta,
}: {
  n: number;
  title: string;
  active?: boolean;
  done?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  compact?: React.ReactNode;
  meta?: React.ReactNode;
}) => (
  <section
    className={`mb-4 rounded-3xl border p-4 sm:p-5 transition ${
      disabled
        ? 'border-slate-100 bg-slate-50/50 opacity-60'
        : active
          ? 'border-blue-200 bg-white shadow-sm'
          : 'border-slate-100 bg-white'
    }`}
  >
    <header className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
            done
              ? 'bg-emerald-100 text-emerald-700'
              : active
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {done ? <Check size={12} /> : n}
        </span>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      {meta}
    </header>
    {done && compact ? compact : children}
  </section>
);

const SmartLabel = ({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
    {icon}
    {children}
  </div>
);

const ChipItem = ({ hit, onAdd }: { hit: ProductHit; onAdd: () => void }) => {
  const isTool = hit.category_type === 'tool';
  const out = (hit.current_stock ?? 0) <= 0;
  return (
    <button
      type="button"
      disabled={out}
      onClick={onAdd}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition max-w-full ${
        out
          ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
          : isTool
            ? 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
      }`}
    >
      <Plus size={12} />
      <span className="truncate max-w-[180px]">{hit.name}</span>
      <span className="text-slate-400">· {hit.current_stock ?? 0}</span>
    </button>
  );
};

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
      danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);
