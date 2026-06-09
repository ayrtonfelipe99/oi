import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, RotateCcw, Save } from 'lucide-react';

export const Route = createFileRoute('/permissions')({
  head: () => ({ meta: [{ title: 'Permissões | SAAS Almoxarifado' }] }),
  component: PermissionsPage,
});

type ManagedRole = 'admin' | 'operador';

interface PermItem {
  key: string;
  label: string;
}
interface PermModule {
  module: string;
  items: PermItem[];
}

const MODULES: PermModule[] = [
  { module: 'Dashboard', items: [{ key: 'dashboard.view', label: 'Visualizar dashboard' }] },
  { module: 'Monitoramento', items: [{ key: 'monitoring.view', label: 'Ver ranking de saídas' }] },
  {
    module: 'EPIs',
    items: [
      { key: 'epis.view', label: 'Visualizar' },
      { key: 'epis.create', label: 'Criar' },
      { key: 'epis.edit', label: 'Editar' },
      { key: 'epis.delete', label: 'Excluir' },
    ],
  },
  {
    module: 'Ferramentas',
    items: [
      { key: 'tools.view', label: 'Visualizar' },
      { key: 'tools.create', label: 'Criar' },
      { key: 'tools.edit', label: 'Editar' },
      { key: 'tools.delete', label: 'Excluir' },
    ],
  },
  {
    module: 'Almoxarifados',
    items: [
      { key: 'warehouses.view', label: 'Visualizar' },
      { key: 'warehouses.create', label: 'Criar' },
      { key: 'warehouses.edit', label: 'Editar' },
      { key: 'warehouses.delete', label: 'Excluir' },
    ],
  },
  {
    module: 'Colaboradores',
    items: [
      { key: 'staff.view', label: 'Visualizar' },
      { key: 'staff.create', label: 'Criar' },
      { key: 'staff.edit', label: 'Editar' },
      { key: 'staff.delete', label: 'Excluir' },
      { key: 'staff.import', label: 'Importar Excel' },
    ],
  },
  {
    module: 'Movimentações',
    items: [
      { key: 'movements.exit', label: 'Saída' },
      { key: 'movements.return', label: 'Devolução' },
      { key: 'movements.in', label: 'Entrada' },
      { key: 'movements.transfer', label: 'Transferência' },
    ],
  },
  {
    module: 'Ordens de Serviço',
    items: [
      { key: 'service_orders.view', label: 'Visualizar' },
      { key: 'service_orders.create', label: 'Criar' },
      { key: 'service_orders.edit', label: 'Editar' },
      { key: 'service_orders.delete', label: 'Excluir' },
    ],
  },
  {
    module: 'Configurações',
    items: [
      { key: 'settings.categories', label: 'Categorias' },
      { key: 'settings.templates', label: 'Modelos de documento' },
    ],
  },
];

const DEFAULT_ADMIN = new Set<string>(MODULES.flatMap((m) => m.items.map((i) => i.key)));
const DEFAULT_OPERADOR = new Set<string>([
  'dashboard.view',
  'epis.view',
  'tools.view',
  'warehouses.view',
  'staff.view',
  'movements.exit',
  'movements.return',
  'service_orders.view',
]);

function PermissionsPage() {
  const navigate = useNavigate();
  const { user, isReady, isProgramador, loading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isReady || loading) return;
    if (!user) {
      navigate({ to: '/auth', replace: true });
      return;
    }
    if (!isProgramador) {
      toast.error('Apenas o programador pode acessar esta área.');
      navigate({ to: '/', replace: true });
    }
  }, [user, isProgramador, isReady, loading, navigate]);

  const { data: current, isLoading } = useQuery({
    queryKey: ['role-permissions-all'],
    enabled: isProgramador,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission')
        .in('role', ['admin', 'operador']);
      if (error) throw error;
      const map: Record<ManagedRole, Set<string>> = {
        admin: new Set(),
        operador: new Set(),
      };
      for (const r of data ?? []) {
        if (r.role === 'admin' || r.role === 'operador') {
          map[r.role as ManagedRole].add(r.permission as string);
        }
      }
      return map;
    },
  });

  const [admin, setAdmin] = useState<Set<string>>(new Set());
  const [operador, setOperador] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (current) {
      setAdmin(new Set(current.admin));
      setOperador(new Set(current.operador));
      setDirty(false);
    }
  }, [current]);

  const toggle = (role: ManagedRole, key: string, checked: boolean) => {
    const state = role === 'admin' ? admin : operador;
    const setter = role === 'admin' ? setAdmin : setOperador;
    const next = new Set(state);
    if (checked) next.add(key);
    else next.delete(key);
    setter(next);
    setDirty(true);
  };

  const restoreDefaults = () => {
    setAdmin(new Set(DEFAULT_ADMIN));
    setOperador(new Set(DEFAULT_OPERADOR));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      // Snapshot atual no banco
      const cur = current ?? { admin: new Set<string>(), operador: new Set<string>() };

      const toInsert: { role: ManagedRole; permission: string }[] = [];
      const toDelete: { role: ManagedRole; permission: string }[] = [];

      for (const k of admin) if (!cur.admin.has(k)) toInsert.push({ role: 'admin', permission: k });
      for (const k of cur.admin) if (!admin.has(k)) toDelete.push({ role: 'admin', permission: k });
      for (const k of operador) if (!cur.operador.has(k)) toInsert.push({ role: 'operador', permission: k });
      for (const k of cur.operador) if (!operador.has(k)) toDelete.push({ role: 'operador', permission: k });

      if (toInsert.length) {
        const { error } = await supabase.from('role_permissions').insert(toInsert);
        if (error) throw error;
      }
      for (const d of toDelete) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', d.role)
          .eq('permission', d.permission);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Permissões salvas!');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['role-permissions-all'] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao salvar permissões'),
  });

  const totalAdmin = admin.size;
  const totalOperador = operador.size;

  if (!isProgramador) return null;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Permissões
            </h1>
            <p className="text-sm text-muted-foreground">
              Defina o que cada papel pode fazer. Programador sempre tem acesso total.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={restoreDefaults} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restaurar padrão
            </Button>
            <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
              {save.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground p-8">
            <Loader2 className="animate-spin h-4 w-4" /> Carregando permissões…
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-3">
                <span>Matriz de permissões</span>
                <Badge variant="secondary">Admin: {totalAdmin}</Badge>
                <Badge variant="secondary">Operador: {totalOperador}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-full">
                        Ação
                      </th>
                      <th className="text-center py-2 px-4 font-medium w-24">Admin</th>
                      <th className="text-center py-2 px-4 font-medium w-24">Operador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((mod) => (
                      <React.Fragment key={mod.module}>
                        <tr className="bg-muted/50">
                          <td colSpan={3} className="py-2 px-2 font-semibold text-slate-700">
                            {mod.module}
                          </td>
                        </tr>
                        {mod.items.map((it) => (
                          <tr key={it.key} className="border-b hover:bg-muted/30">
                            <td className="py-2 pl-6 pr-4">
                              <div>{it.label}</div>
                              <div className="text-xs text-muted-foreground font-mono">{it.key}</div>
                            </td>
                            <td className="text-center">
                              <Checkbox
                                checked={admin.has(it.key)}
                                onCheckedChange={(c) => toggle('admin', it.key, !!c)}
                              />
                            </td>
                            <td className="text-center">
                              <Checkbox
                                checked={operador.has(it.key)}
                                onCheckedChange={(c) => toggle('operador', it.key, !!c)}
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                As mudanças entram em vigor na próxima vez que o usuário atualizar a página.
                Permissão de <strong>gerenciar usuários</strong> permanece exclusiva do programador
                e não aparece aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
