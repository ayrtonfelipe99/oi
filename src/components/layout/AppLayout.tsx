import React, { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";
import Sidebar from './Sidebar';
import { Bell, Search, User, Settings, ClipboardList, Menu, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useServiceOrderStore } from '@/hooks/use-service-order-store';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { selectedSoId } = useServiceOrderStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isProgramador, hasAccess, loading, error, retry } = useAuth();
  const redirectHandledRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.warn('[layout] motivo do redirecionamento: usuário não autenticado');
      navigate({ to: '/auth', replace: true });
      return;
    }

    if (!hasAccess && !error && !redirectHandledRef.current) {
      redirectHandledRef.current = true;
      console.warn('[layout] motivo do redirecionamento: usuário sem papel de admin/programador');
      toast.error('Acesso restrito a administradores e programadores.');
      void supabase.auth.signOut();
      navigate({ to: '/auth', replace: true });
    }
  }, [error, loading, user, hasAccess, navigate]);

  useEffect(() => {
    if (user && hasAccess) {
      redirectHandledRef.current = false;
    }
  }, [user, hasAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm font-medium">Carregando sua sessão…</p>
        </div>
      </div>
    );
  }

  if (error && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900">Não foi possível carregar a página</h1>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => retry('manual_retry')}>Tentar novamente</Button>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: '/auth', replace: true });
              }}
            >
              Voltar ao login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm font-medium">Redirecionando…</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const initials = displayName
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair');
      return;
    }
    toast.success('Sessão encerrada');
    navigate({ to: '/auth', replace: true });
  };


  const isServiceOrdersPage = location.pathname === '/service-orders';
  const isStaffPage = location.pathname === '/staff';
  const isDashboard = location.pathname === '/';
  const isMovements = location.pathname.startsWith('/movements');
  const shouldShowSelectionPrompt = !selectedSoId && !isServiceOrdersPage && !isStaffPage && !isDashboard && !isMovements;

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50/50 relative">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <div className={cn("flex-1 flex flex-col min-w-0 max-w-full transition-all duration-300 ease-in-out", isSidebarCollapsed ? "md:ml-20" : "md:ml-64")}>
        <header className={cn("h-14 sm:h-16 lg:h-20 border-b border-slate-100 bg-white/70 backdrop-blur-xl flex items-center px-3 lg:px-10 justify-between fixed top-0 right-0 left-0 z-30 transition-all duration-300", isSidebarCollapsed ? "md:left-20" : "md:left-64")}>

          <div className="flex items-center flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden mr-2"
            >
              <Menu size={20} />
            </Button>
            
            <div className="hidden md:flex items-center bg-slate-100/50 rounded-2xl px-4 py-2.5 w-full max-w-sm border border-slate-200/50 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-500/5 transition-all duration-300">
              <Search size={18} className="text-slate-400 mr-3" />
              <input 
                type="text" 
                placeholder="Pesquisar no sistema..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-blue-600 rounded-full">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 sm:space-x-3 hover:bg-slate-100 rounded-full pl-1 pr-2 sm:pr-3 py-1 h-auto">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-blue-400 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/20 border-2 border-white transition-transform active:scale-95">
                    {initials}
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">{displayName}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {isAdmin ? 'Administrador' : isProgramador ? 'Programador' : (profile?.role || 'Operador')}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-slate-200 shadow-xl">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-2.5">
                  <User className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => navigate({ to: '/settings' })}>
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>
        
        <main className={cn("flex-1 min-w-0 max-w-full bg-slate-50/50 overflow-x-hidden mt-14 sm:mt-16 lg:mt-20", isMovements ? "p-0" : "p-3 sm:p-6 lg:p-12")}>
          <div className="max-w-[1600px] mx-auto w-full min-w-0">

            {shouldShowSelectionPrompt ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 shadow-sm">
                  <ClipboardList size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                  Escolha uma O.S.
                </h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                  Para visualizar as informações desta página, você precisa selecionar uma Ordem de Serviço ativa no menu lateral.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-sm font-bold flex items-center gap-2">
                    <Search size={18} />
                    Use o seletor no topo do menu lateral
                  </div>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
