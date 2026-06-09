import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Trophy, Medal, Award, HardHat, Wrench, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/monitoring')({
  head: () => ({ meta: [{ title: 'Monitoramento de Saídas | SAAS Almoxarifado' }] }),
  component: MonitoringPage,
});

type RangeDays = '7' | '30' | '90' | '365' | 'all';

function MonitoringPage() {
  const navigate = useNavigate();
  const { user, isReady, loading } = useAuth();
  const canView = usePermission('monitoring.view');

  useEffect(() => {
    if (!isReady || loading) return;
    if (!user) { navigate({ to: '/auth', replace: true }); return; }
    if (!canView) {
      toast.error('Você não tem permissão para acessar esta página.');
      navigate({ to: '/', replace: true });
    }
  }, [user, isReady, loading, canView, navigate]);

  const [categoryId, setCategoryId] = useState<string>('all');
  const [kind, setKind] = useState<'all' | 'epi' | 'tool'>('all');
  const [range, setRange] = useState<RangeDays>('30');

  const { data: categories } = useQuery({
    queryKey: ['monitoring-categories'],
    enabled: !!user && canView,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, type')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (kind === 'all') return categories;
    return categories.filter((c: any) => c.type === kind);
  }, [categories, kind]);

  useEffect(() => {
    if (categoryId !== 'all' && !filteredCategories.some((c: any) => c.id === categoryId)) {
      setCategoryId('all');
    }
  }, [filteredCategories, categoryId]);

  const sinceISO = useMemo(() => {
    if (range === 'all') return null;
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    return d.toISOString();
  }, [range]);

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['monitoring-ranking', categoryId, kind, range],
    enabled: !!user && canView,
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('quantity, staff_id, material_kind, product:products!inner(category_id), staff:staff!inner(id, full_name, registration_number, role)')
        .eq('type', 'out')
        .eq('status', 'completed')
        .not('staff_id', 'is', null);

      if (sinceISO) q = q.gte('created_at', sinceISO);
      if (kind !== 'all') q = q.eq('material_kind', kind);
      if (categoryId !== 'all') q = q.eq('product.category_id', categoryId);

      const { data, error } = await q.limit(5000);
      if (error) throw error;

      const map = new Map<string, { staff: any; total: number; events: number }>();
      for (const r of (data ?? []) as any[]) {
        if (!r.staff) continue;
        const k = r.staff.id;
        const entry = map.get(k) ?? { staff: r.staff, total: 0, events: 0 };
        entry.total += Number(r.quantity ?? 0);
        entry.events += 1;
        map.set(k, entry);
      }
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });

  const top = ranking ?? [];
  const totalItems = top.reduce((s, r) => s + r.total, 0);
  const totalEvents = top.reduce((s, r) => s + r.events, 0);

  return (
    <AppLayout>
      <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <TrendingUp className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Monitoramento de Saídas</h1>
            <p className="text-sm text-slate-500">Ranking dos colaboradores que mais retiraram materiais.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Filter size={16}/> Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Tipo</label>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="epi">EPIs</SelectItem>
                  <SelectItem value="tool">Ferramentas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Categoria</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {filteredCategories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Período</label>
              <Select value={range} onValueChange={(v) => setRange(v as RangeDays)}>
                <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                  <SelectItem value="all">Tudo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Colaboradores" value={top.length} />
          <StatCard label="Itens retirados" value={totalItems} />
          <StatCard label="Movimentações" value={totalEvents} />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy size={16} className="text-amber-500"/> Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="animate-spin mr-2" size={18}/> Carregando...
              </div>
            ) : top.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Nenhuma saída encontrada com esses filtros.
              </div>
            ) : (
              <div className="divide-y">
                {top.map((row, idx) => (
                  <RankRow key={row.staff.id} index={idx} row={row} kind={kind}/>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase font-bold text-slate-500">{label}</p>
        <p className="text-3xl font-black mt-1">{value.toLocaleString('pt-BR')}</p>
      </CardContent>
    </Card>
  );
}

function RankRow({ index, row, kind }: { index: number; row: any; kind: 'all' | 'epi' | 'tool' }) {
  const medal = index === 0 ? <Trophy className="text-amber-500" size={18}/>
    : index === 1 ? <Medal className="text-slate-400" size={18}/>
    : index === 2 ? <Award className="text-amber-700" size={18}/>
    : <span className="text-xs font-bold text-slate-400 w-[18px] text-center">{index + 1}</span>;

  const Icon = kind === 'tool' ? Wrench : HardHat;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 flex justify-center">{medal}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{row.staff.full_name}</p>
        <p className="text-xs text-slate-500 truncate">
          {row.staff.registration_number} {row.staff.role ? `• ${row.staff.role}` : ''}
        </p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="gap-1">
          <Icon size={12}/> {row.total} itens
        </Badge>
        <p className="text-[10px] text-slate-500 mt-1">{row.events} movimentações</p>
      </div>
    </div>
  );
}
