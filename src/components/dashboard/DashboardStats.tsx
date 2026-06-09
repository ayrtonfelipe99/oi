import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  ArrowUpRight, 
  AlertTriangle, 
  Wrench,
  HardHat,
  Warehouse,
  ShoppingCart,
  PackageX,
  UserCheck,
  Briefcase,
  ArrowDownLeft,
  ArrowUpRight as ArrowUpRightIcon,
  ClipboardList,
  Eye,
  Ear,
  Wind,
  Shirt,
  Shield,
  Hand,
  Footprints
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const allCategories = [
  { id: '01', label: '01. Proteção de Cabeça', type: 'epi' },
  { id: '02', label: '02. Proteção Visual e Facial', type: 'epi' },
  { id: '03', label: '03. Proteção Auditiva', type: 'epi' },
  { id: '04', label: '04. Proteção Respiratória', type: 'epi' },
  { id: '05', label: '05. Camisas', type: 'epi' },
  { id: '06', label: '06. Proteção de Tronco', type: 'epi' },
  { id: '07', label: '07. Membros Superiores', type: 'epi' },
  { id: '08', label: '08. Calças', type: 'epi' },
  { id: '09', label: '09. Botas', type: 'epi' },
  { id: '10', label: '10. Proteção Contra Queda', type: 'epi' },
  { id: '11', label: '11. Ferramentas Manuais', type: 'tool' },
  { id: '12', label: '12. Ferramentas Elétricas', type: 'tool' },
  { id: '13', label: '13. Equipamentos Diversos', type: 'tool' },
  { id: '14', label: '14. Acessórios P/ Ferramentas', type: 'tool' },
];

interface DashboardStatsProps {
  type?: 'all' | 'epi' | 'tool';
  warehouseId?: string;
}

export const DashboardStats = ({ type = 'all', warehouseId }: DashboardStatsProps) => {
  const { data: counts, isLoading, error } = useQuery({
    queryKey: ['dashboard-counts', type, warehouseId],
    queryFn: async () => {
      if (import.meta.env.DEV) console.log('[dashboard-stats] página atual:', window.location.pathname);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { data: products },
        { data: categoriesData },
        { count: staffCount },
        { count: warehouseCount },
        { count: operatorCount },
        { count: managerCount },
        { data: transactionsToday },
        { count: soCount }
      ] = await Promise.all([
        supabase.from('products').select('current_stock, min_stock, category_id, warehouse_id'),
        supabase.from('categories').select('id, type, name'),
        supabase.from('staff').select('*', { count: 'exact', head: true }),
        supabase.from('warehouses').select('*', { count: 'exact', head: true }),
        supabase.from('staff').select('*', { count: 'exact', head: true }).in('role', ['Operador', 'Ajudante']),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('role', 'almoxarife')
          .filter('warehouse_id', warehouseId ? 'eq' : 'is', warehouseId || null),
        supabase.from('transactions').select('type, quantity, warehouse_id').gte('created_at', today.toISOString()),
        supabase.from('service_orders').select('*', { count: 'exact', head: true })
      ]);

      if (import.meta.env.DEV) {
        console.log('[dashboard-stats] resultado da busca no banco', {
          staffCount,
          warehouseCount,
          operatorCount,
          managerCount,
          soCount,
        });
      }


      const catMap = (categoriesData || []).reduce((acc: any, cat: any) => {
        acc[cat.id] = { type: cat.type, name: cat.name as string };
        return acc;
      }, {});

      // Determina o tipo (epi/tool) priorizando o vínculo real com categories
      const getCategoryType = (p: any) => {
        const linked = catMap[p.category_id];
        if (linked) return linked.type;
        const prefix = p.name?.substring(0, 2);
        const staticCat = allCategories.find(c => c.id === prefix);
        return staticCat?.type || 'epi';
      };


      const filteredProducts = (products as any[]) || [];
      const warehouseProducts = warehouseId 
        ? filteredProducts.filter(p => p.warehouse_id === warehouseId)
        : filteredProducts;


      const epiCount = warehouseProducts.filter(p => getCategoryType(p) === 'epi').length;
      const toolCount = warehouseProducts.filter(p => getCategoryType(p) === 'tool').length;
      
      // Filter based on type prop if needed
      const typeFilteredProducts = type === 'all' 
        ? warehouseProducts 
        : warehouseProducts.filter(p => getCategoryType(p) === type);

      const lowStockCount = typeFilteredProducts.filter(p => (p.min_stock || 0) > 0 && p.current_stock <= (p.min_stock || 0)).length;
      const outStockCount = typeFilteredProducts.filter(p => p.current_stock === 0).length;

      const filteredTransactions = warehouseId
        ? (transactionsToday || []).filter(t => t.warehouse_id === warehouseId)
        : (transactionsToday || []);

      const inToday = filteredTransactions.filter(t => t.type === 'in').reduce((acc, t) => acc + (t.quantity || 0), 0) || 0;
      const outToday = filteredTransactions.filter(t => t.type === 'out').reduce((acc, t) => acc + (t.quantity || 0), 0) || 0;

      return {
        epi: epiCount || 0,
        tool: toolCount || 0,
        staff: staffCount || 0,
        warehouses: warehouseCount || 0,
        lowStock: lowStockCount || 0,
        outStock: outStockCount || 0,
        operators: operatorCount || 0,
        managers: managerCount || 0,
        inToday,
        outToday,
        totalSo: soCount || 0
      };
    }
  });

  const getStats = () => {
    if (warehouseId) {
      return [
        { title: "Total de EPIs", value: counts?.epi ?? 0, icon: HardHat, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Total de Ferramentas", value: counts?.tool ?? 0, icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50" },
        { title: "Almoxarifado", value: 1, icon: Warehouse, color: "text-cyan-600", bg: "bg-cyan-50" },
        { title: "Alertas de Reposição", value: counts?.lowStock ?? 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Saldo Zerado", value: counts?.outStock ?? 0, icon: PackageX, color: "text-red-600", bg: "bg-red-50" },
      ];
    }

    if (type === 'all') {
      return [
        { title: "Total de EPIs", value: counts?.epi ?? 0, icon: HardHat, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Total de Ferramentas", value: counts?.tool ?? 0, icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50" },
        { title: "Colaboradores", value: counts?.staff ?? 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Almoxarifado (O.S.)", value: counts?.managers ?? 0, icon: Warehouse, color: "text-cyan-600", bg: "bg-cyan-50" },
        { title: "Total de O.S.", value: counts?.totalSo ?? 0, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Total de Operadores", value: counts?.operators ?? 0, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Entradas Hoje", value: counts?.inToday ?? 0, icon: ArrowDownLeft, color: "text-emerald-700", bg: "bg-emerald-100" },
        { title: "Saídas Hoje", value: counts?.outToday ?? 0, icon: ArrowUpRightIcon, color: "text-amber-700", bg: "bg-amber-100" },
        { title: "Alertas de Reposição", value: counts?.lowStock ?? 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Saldo Zerado", value: counts?.outStock ?? 0, icon: PackageX, color: "text-red-600", bg: "bg-red-50" },
        { title: "Almoxarifados", value: counts?.warehouses ?? 0, icon: Warehouse, color: "text-slate-600", bg: "bg-slate-50" },
      ];
    }

    if (type === 'epi') {
      return [
        { title: "Total de EPIs", value: counts?.epi ?? 0, icon: HardHat, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Nível Crítico", value: counts?.lowStock ?? 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Saldo Zerado", value: counts?.outStock ?? 0, icon: PackageX, color: "text-red-600", bg: "bg-red-50" },
      ];
    }

    if (type === 'tool') {
      return [
        { title: "Total de Ferramentas", value: counts?.tool ?? 0, icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50" },
        { title: "Nível Crítico", value: counts?.lowStock ?? 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Saldo Zerado", value: counts?.outStock ?? 0, icon: PackageX, color: "text-red-600", bg: "bg-red-50" },
      ];
    }

    return [];
  };

  const stats = getStats();

  if (stats.length === 0) return null;

  if (error) {
    if (import.meta.env.DEV) console.error('[dashboard-stats] erros retornados pelo banco:', error);
    return (
      <Card className="border border-amber-200 bg-amber-50/70 shadow-none">
        <CardContent className="p-4 text-sm font-medium text-amber-900">
          Não foi possível carregar os indicadores do painel agora. Atualize a página em instantes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3 w-full overflow-x-hidden">
      {isLoading ? (
        Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm h-28 animate-pulse bg-slate-100/50 rounded-[1.5rem]" />
        ))
      ) : (
        stats.map((stat, index) => {
          return (
            <Card key={index} className="min-w-0 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500 bg-white/70 backdrop-blur-sm hover:bg-white rounded-xl sm:rounded-[1.5rem] relative flex flex-col h-full w-full">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4 h-full">
                <div className={cn(
                  "w-12 h-12 flex items-center justify-center shrink-0 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                  stat.bg,
                  stat.color
                )}>
                  <stat.icon size={24} strokeWidth={2.5} />
                </div>
                
                <div className="flex flex-col min-w-0 justify-center">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">
                    {stat.value}
                  </span>
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.12em] leading-tight mt-1 opacity-80 group-hover:opacity-100 transition-opacity break-words line-clamp-2">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};