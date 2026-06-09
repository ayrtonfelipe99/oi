import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from '@tanstack/react-router';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  User, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  Briefcase,
  Users,
  AlertCircle,
  Wrench,
  GraduationCap,
  Target,
  Upload
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StaffForm } from "@/components/staff/StaffForm";
import { StaffProfile } from "@/components/staff/StaffProfile";
import { ExcelUpload } from "@/components/staff/ExcelUpload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

const Staff = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: staff, isLoading, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          staff_equipment(count),
          staff_trainings(count)
        `)
        .order('full_name');
      if (error) throw error;
      return data;
    }
  });

  // Calculate summary stats
  const stats = {
    total: staff?.length || 0,
    active: staff?.filter(s => s.status === 'active').length || 0,
    withEquipment: staff?.filter(s => s.staff_equipment?.[0]?.count > 0).length || 0,
    withPendingTrainings: staff?.filter(s => !s.staff_trainings || s.staff_trainings?.[0]?.count === 0).length || 0
  };

  const handleEdit = (person: any) => {
    setSelectedStaff(person);
    setIsDialogOpen(true);
  };

  const handleViewProfile = (person: any) => {
    navigate({ to: '/staff/$id', params: { id: person.id } });
  };

  const handleCreate = () => {
    setSelectedStaff(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Erro ao excluir colaborador');
      } else {
        toast.success('Colaborador excluído com sucesso');
        refetch();
      }
    }
  };

  const filteredStaff = staff?.filter(person => {
    const matchesSearch = 
      person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.registration_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.cpf?.includes(searchQuery) ||
      person.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.cost_center?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 w-full min-w-0">
        <div className="min-w-0 max-w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2 break-words">
            <Users className="text-blue-600 shrink-0" />
            <span className="min-w-0 break-words">Colaboradores</span>
          </h1>
          <p className="text-slate-500 font-medium break-words">Gestão centralizada de equipes, EPIs e ferramentas.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 w-full lg:w-auto min-w-0">
          <Button
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 h-12 px-4 sm:px-6 rounded-2xl font-bold w-full sm:w-auto sm:flex-1 lg:flex-initial min-w-0 max-w-full whitespace-normal text-sm sm:text-base"
            onClick={() => setIsExcelOpen(true)}
          >
            <Upload className="mr-2 h-5 w-5 text-slate-500 shrink-0" />
            <span className="truncate">Importar Excel</span>
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700 h-12 px-4 sm:px-6 rounded-2xl shadow-xl shadow-blue-200 font-bold w-full sm:w-auto sm:flex-1 lg:flex-initial min-w-0 max-w-full whitespace-normal text-sm sm:text-base"
                onClick={handleCreate}
              >
                <Plus className="mr-2 h-5 w-5 shrink-0" />
                <span className="truncate">Cadastrar Colaborador</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[min(600px,calc(100vw-24px))] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle className="break-words">{selectedStaff ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}</DialogTitle>
              </DialogHeader>
              <StaffForm 
                staff={selectedStaff} 
                onSuccess={() => {
                  setIsDialogOpen(false);
                  refetch();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>


        <ExcelUpload 
          isOpen={isExcelOpen} 
          onOpenChange={setIsExcelOpen} 
          onSuccess={() => refetch()} 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 w-full min-w-0">
        <StatCard label="Total" value={stats.total} icon={<Users size={20} />} tone="blue" />
        <StatCard label="Ativos" value={stats.active} icon={<ShieldCheck size={20} />} tone="emerald" />
        <StatCard label="Em Posse" value={stats.withEquipment} icon={<Wrench size={20} />} tone="amber" />
        <StatCard label="Pendências" value={stats.withPendingTrainings} icon={<AlertCircle size={20} />} tone="rose" />
      </div>


      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-full min-w-0">
        <div className="relative flex-1 w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, matrícula, CPF ou função..."
            className="pl-10 border-none bg-transparent focus-visible:ring-0 w-full rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0 pb-1 sm:pb-0">
          <Badge 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            className="cursor-pointer rounded-full h-8 px-4"
            onClick={() => setStatusFilter('all')}
          >
            Todos
          </Badge>
          <Badge 
            variant={statusFilter === 'active' ? 'default' : 'outline'} 
            className="cursor-pointer rounded-full h-8 px-4"
            onClick={() => setStatusFilter('active')}
          >
            Ativos
          </Badge>
          <Badge 
            variant={statusFilter === 'away' ? 'default' : 'outline'} 
            className="cursor-pointer rounded-full h-8 px-4"
            onClick={() => setStatusFilter('away')}
          >
            Afastados
          </Badge>
          <Badge 
            variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
            className="cursor-pointer rounded-full h-8 px-4"
            onClick={() => setStatusFilter('inactive')}
          >
            Desligados
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 w-full min-w-0">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-slate-50 rounded-xl"></div>
                <div className="h-10 bg-slate-50 rounded-xl"></div>
              </div>
            </div>
          ))
        ) : filteredStaff?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={<User size={40} />}
              title="Nenhum colaborador encontrado."
              variant="dashed"
            />
          </div>

        ) : (
          filteredStaff?.map((person) => (
            <div
              key={person.id}
              role="button"
              tabIndex={0}
              aria-label={`Abrir perfil de ${person.full_name}`}
              onClick={() => handleViewProfile(person)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewProfile(person);
                }
              }}
              className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-500">
                        <User size={30} />
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
                        person.status === 'active' ? "bg-green-500" : "bg-slate-400"
                      )}>
                        {person.status === 'active' && <ShieldCheck size={10} className="text-white" />}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors truncate">
                        {person.full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                        <Briefcase size={13} />
                        <span className="text-sm truncate">{person.role || 'Cargo não definido'}</span>
                      </div>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Mais ações" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                          <MoreHorizontal className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                        <DropdownMenuItem onClick={() => handleViewProfile(person)} className="rounded-xl gap-2 cursor-pointer">
                          <Eye className="h-4 w-4 text-blue-500" /> Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(person)} className="rounded-xl gap-2 cursor-pointer">
                          <Edit className="h-4 w-4 text-indigo-500" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 text-red-600 focus:text-red-600 cursor-pointer" onClick={() => handleDelete(person.id)}>
                          <Trash2 className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-1">Matrícula</p>
                    <p className="text-sm font-bold text-slate-700">{person.registration_number || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-1">O.S.</p>
                    <p className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
                      <Target size={12} />
                      {person.cost_center || 'NÃO DEF.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between group-hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Calendar size={14} className="text-slate-400" />
                  <span>
                    Admitido em{' '}
                    {person.admission_date
                      ? new Date(person.admission_date).toLocaleDateString('pt-BR')
                      : 'N/D'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-blue-600 hover:text-white hover:bg-blue-600 font-bold text-xs gap-1 h-8 px-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProfile(person);
                  }}
                >
                  ACESSAR PERFIL <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Staff;
