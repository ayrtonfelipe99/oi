import React, { useState, useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ArrowLeftRight, 
  ClipboardList, 
  Settings,
  ShoppingBag,
  History,
  Wrench,
  HardHat,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  LogOut,
  Bell,
  Search,
  User,
  ChevronDown,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useServiceOrderStore } from '@/hooks/use-service-order-store';
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';
import { useAuth } from '@/hooks/useAuth';
import { usePermissionChecker } from '@/hooks/usePermission';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar = ({ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }: { 
  isMobileOpen?: boolean; 
  setIsMobileOpen?: (val: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}) => {
  // Remove redundant local isMobileOpen state if needed, but let's just make it compatible
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  
  const mobileOpen = isMobileOpen !== undefined ? isMobileOpen : localMobileOpen;
  const setMobileOpen = setIsMobileOpen !== undefined ? setIsMobileOpen : setLocalMobileOpen;
  const { selectedSoId, setSelectedSoId } = useServiceOrderStore();
  const { warehouseFilter, setWarehouseFilter } = useWarehouseFilterStore();
  const { user, profile, isReady } = useAuth();

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-sidebar', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('warehouses').select('id, name').order('name');
      return data ?? [];
    },
    enabled: isReady && !!user,
  });

  const { data: myRoles } = useQuery({
    queryKey: ['sidebar-my-roles', user?.id],
    enabled: isReady && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      return (data ?? []).map((r: any) => r.role as string);
    },
  });
  const canManageUsers = (myRoles ?? []).some(
    (r) => r === 'admin' || r === 'programador',
  );
  const isProgramador = (myRoles ?? []).includes('programador');
  const can = usePermissionChecker();

  const { data: serviceOrders } = useQuery({
    queryKey: ['service_orders_list', user?.id, profile?.warehouse_id],
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select('id, title, order_number, warehouse_id');
      
      // Se o usuário tiver um warehouse_id vinculado, filtra apenas as O.S. daquele depósito
      if (profile?.warehouse_id && profile.role !== 'admin') {
        query = query.eq('warehouse_id', profile.warehouse_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isReady && !!user
  });

  // Auto-selecionar se houver apenas uma O.S.
  useEffect(() => {
    if (serviceOrders?.length === 1 && !selectedSoId) {
      setSelectedSoId(serviceOrders[0].id);
    }
  }, [serviceOrders, selectedSoId, setSelectedSoId]);

  const canViewMovements =
    can('movements.exit') || can('movements.return') || can('movements.in') || can('movements.transfer');
  const canViewSettings = can('settings.categories') || can('settings.templates');

  const menuItems = [
    can('dashboard.view') && { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    can('service_orders.view') && { icon: ClipboardList, label: 'Ordens de Serviço', path: '/service-orders' },
    can('epis.view') && { icon: HardHat, label: 'Cadastro de EPIs', path: '/cadastro-epis' },
    can('tools.view') && { icon: Wrench, label: 'Cadastro de Ferramentas', path: '/cadastro-ferramentas' },
    can('warehouses.view') && { icon: Warehouse, label: 'Almoxarifados', path: '/almoxarifados' },
    can('staff.view') && { icon: Users, label: 'Colaboradores', path: '/staff' },
    canViewMovements && { icon: ArrowLeftRight, label: 'Movimentações', path: '/movements' },
    can('monitoring.view') && { icon: TrendingUp, label: 'Monitoramento de Saídas', path: '/monitoring' },
    canManageUsers && { icon: ShieldCheck, label: 'Usuários', path: '/users' },
    isProgramador && { icon: ShieldCheck, label: 'Permissões', path: '/permissions' },
    canViewSettings && { icon: Settings, label: 'Configurações', path: '/settings' },
  ].filter(Boolean) as { icon: any; label: string; path: string }[];


  // Mantendo o menu aberto por padrão conforme solicitado
  useEffect(() => {
    // Não alteramos mais isCollapsed automaticamente no carregamento
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Trigger - Removed from here to be in Header for better UX */}

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-[#0f172a] text-slate-300 transition-all duration-300 ease-in-out z-50 flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.2)] border-r border-white/5 overflow-hidden",
          isCollapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header/Logo */}
        <div className={cn(
          "p-4 flex items-center h-24 transition-all duration-300 relative overflow-hidden",
          isCollapsed ? "justify-center" : "justify-start px-6"
        )}>
          {/* Efeito de brilho no topo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          <div 
            className={cn(
              "flex items-center transition-all duration-500 cursor-pointer hover:opacity-80 active:scale-95 hidden md:flex z-[110]",
              isCollapsed ? "scale-110" : "scale-100"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-white/10 group-hover:rotate-6 transition-transform">
              S
            </div>
            <div className={cn(
              "ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap",
              isCollapsed && !mobileOpen ? "w-0 opacity-0 -translate-x-4 invisible" : "w-auto opacity-100 translate-x-0 visible"
            )}>
              <h2 className="text-xl font-black tracking-tight text-white">
                SAAS <span className="text-blue-500">ALMOX</span>
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mt-1">SISTEMA DE GESTÃO</p>
            </div>
          </div>

          {/* Versão Mobile da Logo (sem clique para recolher) */}
          <div className="flex items-center md:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-white/10">
              S
            </div>
            <div className="ml-3">
              <h2 className="text-xl font-black tracking-tight text-white">
                SAAS <span className="text-blue-500">ALMOX</span>
              </h2>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-9 h-9 flex items-center justify-center transition-all active:scale-95"
          >
            <X size={20} strokeWidth={2.5} />
          </Button>

          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="hidden md:flex items-center justify-center w-6 h-12 rounded-r-xl bg-blue-600 text-white transition-all duration-300 absolute -right-6 top-1/2 -translate-y-1/2 shadow-[5px_0_15px_rgba(37,99,235,0.3)] z-[100] hover:w-8 group cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={18} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />}
          </button>
        </div>

        <div className={cn(
          "px-4 py-4 transition-all duration-300",
          isCollapsed && !mobileOpen ? "px-2" : "px-4"
        )}>
          <div className="relative group">
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all duration-300",
              isCollapsed && !mobileOpen ? "left-1/2 -translate-x-1/2 opacity-0" : "left-3 opacity-100"
            )}>
              <ClipboardList className="h-4 w-4 text-blue-500" />
            </div>
            <Select value={selectedSoId} onValueChange={setSelectedSoId}>
              <SelectTrigger className={cn(
                "h-11 bg-white/5 border-white/10 text-slate-200 rounded-2xl focus:ring-blue-500 hover:bg-slate-900 transition-all shadow-sm overflow-hidden",
                isCollapsed && !mobileOpen ? "w-full px-1 border-none bg-transparent hover:bg-white/5" : "pl-9 w-full"
              )}>
                <div className={cn(
                  "transition-all duration-300 truncate w-full",
                  isCollapsed && !mobileOpen ? "text-[10px] font-bold text-center text-blue-500" : "block"
                )}>
                  <SelectValue placeholder={isCollapsed && !mobileOpen ? "O.S." : "Escolher O.S."} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200 rounded-2xl shadow-2xl">
                {serviceOrders?.map((so) => (
                  <SelectItem key={so.id} value={so.id} className="cursor-pointer hover:bg-blue-600 focus:bg-blue-600 focus:text-white rounded-xl my-1 mx-1">
                    <span className="font-bold text-sm">{so.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative group mt-3">
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all duration-300",
              isCollapsed && !mobileOpen ? "left-1/2 -translate-x-1/2 opacity-0" : "left-3 opacity-100"
            )}>
              <Warehouse className="h-4 w-4 text-amber-500" />
            </div>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className={cn(
                "h-11 bg-white/5 border-white/10 text-slate-200 rounded-2xl focus:ring-amber-500 hover:bg-slate-900 transition-all shadow-sm overflow-hidden",
                isCollapsed && !mobileOpen ? "w-full px-1 border-none bg-transparent hover:bg-white/5" : "pl-9 w-full"
              )}>
                <div className={cn(
                  "transition-all duration-300 truncate w-full",
                  isCollapsed && !mobileOpen ? "text-[10px] font-bold text-center text-amber-500" : "block"
                )}>
                  <SelectValue placeholder={isCollapsed && !mobileOpen ? "ALM" : "Filtrar almoxarifado"} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200 rounded-2xl shadow-2xl">
                <SelectItem value="all" className="cursor-pointer hover:bg-amber-600 focus:bg-amber-600 focus:text-white rounded-xl my-1 mx-1">
                  <span className="font-bold text-sm">Todos os almoxarifados</span>
                </SelectItem>
                {warehouses?.map((w: any) => (
                  <SelectItem key={w.id} value={w.id} className="cursor-pointer hover:bg-amber-600 focus:bg-amber-600 focus:text-white rounded-xl my-1 mx-1">
                    <span className="font-bold text-sm">{w.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 space-y-1.5 scrollbar-none scroll-smooth">
          <TooltipProvider delayDuration={0}>
            {menuItems.map((item) => (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path as any}
                    onClick={() => setMobileOpen(false)}
                    activeProps={{
                      className: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] ring-1 ring-white/20"
                    }}
                    inactiveProps={{
                      className: "text-slate-400 hover:bg-white/5 hover:text-white"
                    }}
                    className={cn(
                      "flex items-center px-4 py-3.5 rounded-[20px] transition-all duration-300 group relative",
                      isCollapsed ? "justify-center" : "space-x-3"
                    )}
                  >
                    <item.icon size={22} className={cn(
                      "transition-transform duration-200 group-hover:scale-110 shrink-0"
                    )} />
                    
                    <div className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
                      isCollapsed && !mobileOpen ? "w-0 opacity-0 invisible hidden" : "w-full opacity-100 visible"
                    )}>
                      <span className="font-medium">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;