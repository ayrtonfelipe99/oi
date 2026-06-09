import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { LowStockPanel } from '@/components/dashboard/LowStockPanel';
import { TodayExitsPanel } from '@/components/dashboard/TodayExitsPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Shield, 
  Wrench, 
  AlertCircle, 
  ArrowRight,
  HardHat, 
  Eye, 
  Ear, 
  Wind, 
  Shirt, 
  Hand, 
  Footprints, 
  Accessibility, 
  ArrowDownCircle,
  Hammer,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Package,
  CircleHelp,
  Info,
  Settings,
  ClipboardList,
  Search,
  Warehouse
} from "lucide-react";
import { useNavigate } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useServiceOrderStore } from '@/hooks/use-service-order-store';
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { useAuth } from '@/hooks/useAuth';


const Pants = ({ size = 24, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 3h14l1 18h-6l-1-11h-2l-1 11h-6z" />
  </svg>
);

const Harness = ({ size = 24, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 3v18M18 3v18" />
    <path d="M6 8h12M6 16h12" />
    <path d="M6 3c0 2 2 4 6 4s6-2 6-4" />
    <path d="M6 21c0-2 2-4 6-4s6 2 6 4" />
  </svg>
);

const allCategories = [
  { id: '01', label: '01. Proteção de Cabeça', icon: HardHat, color: 'text-blue-600', bg: 'bg-blue-50', type: 'epi', description: 'Ex: Capacete vermelho, azul, branco, jugular, suspensão...' },
  { id: '02', label: '02. Proteção Visual e Facial', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50', type: 'epi', description: 'Ex: Óculos de proteção incolor, fumê, protetor facial, máscara de solda...' },
  { id: '03', label: '03. Proteção Auditiva', icon: Ear, color: 'text-cyan-600', bg: 'bg-cyan-50', type: 'epi', description: 'Ex: Protetor tipo plug, abafador de ruídos, protetor de silicone...' },
  { id: '04', label: '04. Proteção Respiratória', icon: Wind, color: 'text-emerald-600', bg: 'bg-emerald-50', type: 'epi', description: 'Ex: Máscara PFF1, PFF2, respirador semifacial, filtros químicos...' },
  { id: '05', label: '05. Camisas', icon: Shirt, color: 'text-orange-600', bg: 'bg-orange-50', type: 'epi', description: 'Ex: Camisa de brim, camisa polo, uniforme operacional, camisa refletiva...' },
  { id: '06', label: '06. Proteção de Tronco', icon: Shield, color: 'text-orange-700', bg: 'bg-orange-100', type: 'epi', description: 'Ex: Avental de raspa, avental de PVC, avental térmico, avental aluminizado...' },
  { id: '07', label: '07. Membros Superiores', icon: Hand, color: 'text-amber-600', bg: 'bg-amber-50', type: 'epi', description: 'Ex: Luva de raspa, luva nitrílica, luva de vaqueta, luva de proteção térmica...' },
  { id: '08', label: '08. Calças', icon: Pants, color: 'text-lime-700', bg: 'bg-lime-100', type: 'epi', description: 'Ex: Calça de brim, calça cargo, calça térmica, calça impermeável...' },
  { id: '09', label: '09. Botas', icon: Footprints, color: 'text-lime-600', bg: 'bg-lime-50', type: 'epi', description: 'Ex: Bota de PVC, botina de segurança com biqueira, sapato ocupacional...' },
  { id: '10', label: '10. Proteção Contra Queda', icon: Harness, color: 'text-purple-600', bg: 'bg-purple-50', type: 'epi', description: 'Ex: Cinturão de segurança, talabarte, trava-quedas, cordas de segurança...' },
  { id: '11', label: '11. Ferramentas Manuais', icon: Hammer, color: 'text-slate-600', bg: 'bg-slate-50', type: 'tool', description: 'Ex: Chave de fenda, alicate, martelo, serrote, chave inglesa...' },
  { id: '12', label: '12. Ferramentas Elétricas', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', type: 'tool', description: 'Ex: Furadeira, parafusadeira, esmerilhadeira, lixadeira, serra circular...' },
  { id: '13', label: '13. Equipamentos Diversos', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50', type: 'tool', description: 'Ex: Cones de sinalização, fitas, cavaletes, lanternas, pilhas...' },
  { id: '14', label: '14. Acessórios P/ Ferramentas', icon: Settings, color: 'text-rose-600', bg: 'bg-rose-50', type: 'tool', description: 'Ex: Brocas, discos de corte, bits, ponteiras, mangueiras pneumáticas, engates...' },
];

const GroupCard = ({ group }: { group: any }) => (
  <Card key={group.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden bg-white/70 backdrop-blur-sm hover:bg-white rounded-2xl border border-white/60 flex flex-col h-full">
    <CardContent className="p-4 sm:p-5 flex items-center gap-4 h-full relative">
      <div className={cn(
        "w-12 h-12 flex items-center justify-center shrink-0 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
        group.bg,
        group.color
      )}>
        <group.icon size={24} strokeWidth={2.5} />
      </div>
      
      <div className="flex flex-col min-w-0 justify-center flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">
            {group.totalItems}
          </span>
          <div className="flex items-center gap-1.5 absolute top-3 right-3">
            {group.lowStock > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[9px] font-black animate-pulse rounded-md">
                {group.lowStock} CRÍTICO
              </Badge>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-slate-100 transition-colors">
                  <Info size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 text-[11px] font-medium leading-relaxed bg-slate-900/95 backdrop-blur-md text-white border-slate-800 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", group.bg.replace('bg-', 'bg-').replace('-50', '-400'))} />
                  <span className="font-black uppercase tracking-[0.1em] text-slate-300">{group.label}</span>
                </div>
                <p className="opacity-80">{group.description}</p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.12em] leading-tight mt-1 opacity-80 group-hover:text-blue-600 transition-all break-words line-clamp-2">
          {group.label}
        </p>
      </div>
    </CardContent>
  </Card>
);


const Dashboard = () => {
  const { selectedSoId, setSelectedSoId } = useServiceOrderStore();
  const { warehouseFilter } = useWarehouseFilterStore();
  const navigate = useNavigate();
  const { user, profile, isReady } = useAuth();
  useDashboardRealtime();

  const { data: serviceOrders } = useQuery({
    queryKey: ['service_orders_list', user?.id, profile?.warehouse_id],
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select('id, title, order_number, warehouse_id');
      
      if (profile?.warehouse_id && profile.role !== 'admin') {
        query = query.eq('warehouse_id', profile.warehouse_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isReady && !!user
  });

  // Nota: a auto-seleção quando há apenas uma O.S. é feita centralmente
  // no Sidebar — não duplicamos a lógica aqui para evitar double-set.


  const selectedSo = serviceOrders?.find(so => so.id === selectedSoId);
  // Prioridade: filtro manual do dashboard > O.S. selecionada > almoxarifado do perfil
  const warehouseId = warehouseFilter !== 'all'
    ? warehouseFilter
    : (selectedSo?.warehouse_id || (profile?.role !== 'admin' ? profile?.warehouse_id : undefined)) ?? undefined;

  const { data: stats, isLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-group-stats', warehouseId],
    queryFn: async () => {
      console.log('[dashboard] página atual:', window.location.pathname);
      let query = supabase
        .from('products')
        .select('*, categories(id, name, type)');
      
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const [{ data: products, error }, { data: dbCategories, error: catErr }] = await Promise.all([
        query,
        supabase.from('categories').select('*').order('name'),
      ]);

      if (error) throw error;
      if (catErr) throw catErr;

      // Carrega helpers (icone + cor) dinamicamente para evitar ciclo de imports
      const { getIconComponent, getColorClasses } = await import('@/lib/categoryIcons');

      const merged = (dbCategories || []).map((dbCat: any) => {
        const prefix = dbCat.name?.substring(0, 2);
        const visual = allCategories.find(c => c.id === prefix);

        const catProducts = (products as any[])?.filter(p => {
          if (p.category_id === dbCat.id) return true;
          if (p.categories?.name === dbCat.name) return true;
          if (visual && p.name?.startsWith(visual.id)) return true;
          return false;
        }) || [];

        const totalItems = catProducts.reduce((acc, p) => acc + (p.current_stock || 0), 0);
        const lowStock = catProducts.filter(p => (p.min_stock || 0) > 0 && (p.current_stock || 0) <= (p.min_stock || 0)).length;

        // Prioriza ícone/cor escolhidos pelo usuário; cai para o catálogo visual padrão e por fim para neutro
        const userIcon = dbCat.icon ? getIconComponent(dbCat.icon) : null;
        const userColors = dbCat.color ? getColorClasses(dbCat.color) : null;

        return {
          id: visual?.id ?? dbCat.id,
          label: dbCat.name,
          icon: userIcon ?? visual?.icon ?? Package,
          color: userColors?.text ?? visual?.color ?? 'text-slate-600',
          bg: userColors?.bg ?? visual?.bg ?? 'bg-slate-50',
          type: dbCat.type as 'epi' | 'tool',
          description: visual?.description ?? '',
          totalItems,
          lowStock,
          count: catProducts.length,
        };
      });

      merged.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true }));
      return merged;

    },
    enabled: isReady && !!user,
  });


  if (statsError) {
    console.error('[dashboard] erros retornados pelo Supabase:', statsError);
  }

  return (
    <div className="p-2 sm:p-4 lg:p-10 space-y-4 sm:space-y-10 animate-in fade-in duration-700 bg-slate-50/30 min-h-screen overflow-x-hidden w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">DASHBOARD</h1>
        <div className="h-1 w-20 bg-amber-500 rounded-full" />
      </div>


      <Tabs defaultValue="geral" className="space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <TabsList className="flex bg-white/80 backdrop-blur-md border border-slate-200/60 p-1 h-auto shadow-sm rounded-xl sm:rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar scroll-smooth">
            <TabsTrigger value="geral" className="flex-1 min-w-[100px] rounded-xl px-3 sm:px-6 py-2.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold transition-all data-[state=active]:shadow-lg active:scale-95">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="epi" className="flex-1 min-w-[100px] rounded-xl px-3 sm:px-6 py-2.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all data-[state=active]:shadow-lg active:scale-95">
              EPIs
            </TabsTrigger>
            <TabsTrigger value="ferramentas" className="flex-1 min-w-[100px] rounded-xl px-3 sm:px-6 py-2.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all data-[state=active]:shadow-lg active:scale-95">
              Ferramentas
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden xl:flex items-center gap-3">
            <div className="h-10 w-[1px] bg-slate-200 mx-2" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Sistema</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">Operacional</span>
              </div>
            </div>
          </div>
        </div>

        <TabsContent value="geral" className="space-y-8">
          <DashboardStats type="all" warehouseId={warehouseId} />
          <div className="grid gap-4 lg:grid-cols-2">
            <LowStockPanel warehouseId={warehouseId} />
            <TodayExitsPanel warehouseId={warehouseId} />
          </div>
        </TabsContent>

        <TabsContent value="epi" className="space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-none shadow-sm h-48 bg-slate-100 rounded-xl" />
              ))
            ) : (
              stats?.filter(g => g.type === 'epi').map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="ferramentas" className="space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-none shadow-sm h-48 bg-slate-100 rounded-xl" />
              ))
            ) : (
              stats?.filter(g => g.type === 'tool').map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;