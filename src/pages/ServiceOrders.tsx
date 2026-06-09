import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  ClipboardList, 
  MoreHorizontal, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  ExternalLink,
  Warehouse
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useServiceOrderStore } from '@/hooks/use-service-order-store';
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';
import { useAuth } from '@/hooks/useAuth';

const ServiceOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setSelectedSoId } = useServiceOrderStore();
  const { warehouseFilter } = useWarehouseFilterStore();
  const { user, profile, isReady } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const { data: serviceOrders, isLoading } = useQuery({
    queryKey: ['service_orders', user?.id, searchTerm, profile?.warehouse_id, warehouseFilter],
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      // Filtro global da sidebar tem prioridade
      if (warehouseFilter !== 'all') {
        query = query.eq('warehouse_id', warehouseFilter);
      } else if (profile?.warehouse_id && profile.role !== 'admin') {
        query = query.eq('warehouse_id', profile.warehouse_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isReady && !!user
  });

  const createSOMutation = useMutation({
    mutationFn: async (newSO: any) => {
      // O Almoxarifado Geral agora é criado automaticamente pelo banco de dados (trigger)
      const orderNumber = `OS-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = { 
        ...newSO, 
        order_number: orderNumber, 
        status: 'open'
      };

      const { data, error } = await supabase
        .from('service_orders')
        .insert([payload])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_list'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success("O.S. e Almoxarifado Geral criados!");
      setIsDialogOpen(false);
      resetForm();
      if (data && data[0]) {
        setSelectedSoId(data[0].id);
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao criar O.S.: " + error.message);
    }
  });

  const updateSOMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string, title: string }) => {
      const { data, error } = await supabase
        .from('service_orders')
        .update({ title })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_list'] });
      toast.success("O.S. atualizada!");
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar O.S.: " + error.message);
    }
  });

  const deleteSOMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_list'] });
      toast.success("O.S. excluída!");
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao excluir O.S.: " + error.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      toast.success("Status da O.S. atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  });

  const resetForm = () => {
    setTitle('');
  };


  const handleCreateSO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Preencha o nome da O.S");
      return;
    }
    createSOMutation.mutate({ title });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-bold"><Clock size={10} className="mr-1" /> Aberta</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold"><CheckCircle2 size={10} className="mr-1" /> Fechada</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[10px] font-bold">{status}</Badge>;
    }
  };

  const handleEditSO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle) {
      toast.error("Preencha o nome da O.S");
      return;
    }
    updateSOMutation.mutate({ 
      id: selectedSO.id, 
      title: editTitle
    });

  };

  const openEditDialog = (so: any) => {
    setSelectedSO(so);
    setEditTitle(so.title);
    setIsEditDialogOpen(true);
  };


  const openDeleteDialog = (so: any) => {
    setSelectedSO(so);
    setIsDeleteDialogOpen(true);
  };

  const selectSO = (id: string) => {
    setSelectedSoId(id);
    toast.info("O.S. selecionada como ativa");
  };

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" />
            O.S.
          </h1>
          <p className="text-slate-500">Gestão técnica de ordens e requisições de almoxarifado.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nova O.S.
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateSO}>
              <DialogHeader>
                <DialogTitle>Criar Nova O.S.</DialogTitle>
                <DialogDescription>
                  Preencha o nome para identificar a nova O.S.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">O.S</Label>
                  <Input 
                    id="title" 
                    placeholder="Ex: Manutenção Elétrica - Torre A" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createSOMutation.isPending}>
                  {createSOMutation.isPending ? "Criando..." : "Confirmar Abertura"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSO}>
            <DialogHeader>
              <DialogTitle>Editar O.S.</DialogTitle>
              <DialogDescription>
                Altere o nome da O.S.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editTitle">O.S</Label>
                <Input 
                  id="editTitle" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateSOMutation.isPending}>
                {updateSOMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir O.S.?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a O.S. 
              {selectedSO && <strong className="block mt-2">{selectedSO.title}</strong>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteSOMutation.mutate(selectedSO.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      

      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar O.S. pelo nome..."
            className="pl-10 border-none bg-transparent focus-visible:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 border rounded-xl sm:rounded-2xl bg-white shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200">
          <Table className="min-w-full">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-700">O.S</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Data de Abertura</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                    Sincronizando O.S....
                  </TableCell>
                </TableRow>
              ) : serviceOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                    Nenhuma O.S. encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                serviceOrders?.map((so) => (
                  <TableRow key={so.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                    <TableCell>
                      <p className="font-bold text-slate-900 leading-none">{so.title}</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(so.status)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(so.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 rounded-full">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => selectSO(so.id)} className="cursor-pointer">
                            <ExternalLink className="mr-2 h-4 w-4 text-blue-500" />
                            Selecionar como Ativa
                          </DropdownMenuItem>
                          {so.warehouse_id && (
                            <DropdownMenuItem onClick={() => navigate({ to: '/almoxarifados/$id', params: { id: so.warehouse_id! } })} className="cursor-pointer">
                              <Warehouse className="mr-2 h-4 w-4 text-emerald-600" />
                              Ver Almoxarifado
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEditDialog(so)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                            Editar Nome
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] uppercase text-slate-500 font-bold">Mudar Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: so.id, status: 'open' })} className="cursor-pointer">
                            <Clock className="mr-2 h-4 w-4 text-blue-500" />
                            Marcar como Aberta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: so.id, status: 'completed' })} className="cursor-pointer">
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                            Marcar como Fechada
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(so)} 
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir O.S.
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ServiceOrders;
