import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Filter, MoreHorizontal, Warehouse, MapPin, Calendar, ClipboardList, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateWarehouseDialog } from '@/components/warehouses/CreateWarehouseDialog';
import { EditWarehouseDialog } from '@/components/warehouses/EditWarehouseDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Warehouses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
  const navigate = useNavigate();

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <PageHeader
        icon={<Warehouse />}
        iconClassName="text-blue-600"
        title="Almoxarifados"
        description="Gerencie os locais de armazenamento e depósitos da empresa."
        actions={<CreateWarehouseDialog />}
      />

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar almoxarifado pelo nome ou localização..."
        trailing={
          <Button variant="ghost" size="sm" className="text-slate-500 hidden sm:flex">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        }
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))
        ) : warehouses?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={<Warehouse className="h-12 w-12" />}
              title="Nenhum almoxarifado encontrado"
              description="Crie um novo almoxarifado para começar a gerenciar seus itens."
            />
          </div>
        ) : (
          warehouses?.map((warehouse) => (
            <Card 
              key={warehouse.id} 
              className="group border-none shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden bg-white border border-slate-100 flex flex-col"
              onClick={() => {
                console.log('Navigating to warehouse:', warehouse.id);
                navigate({ to: '/almoxarifados/$id', params: { id: warehouse.id } });
              }}

            >
              <CardHeader className="p-5 pb-2">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Warehouse size={24} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal size={16} className="text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWarehouse(warehouse);
                        }}
                      >
                        <Pencil size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight uppercase line-clamp-2 min-h-[3.5rem]">
                      {warehouse.name}
                    </h3>
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <MapPin size={12} className="text-blue-500" />
                        {warehouse.location || 'Localização não informada'}
                      </div>
                      {warehouse.name.includes('Almoxarifado Geral - ') && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                          <ClipboardList size={12} />
                          Vinculado a O.S.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
                      <Calendar size={12} />
                      {format(new Date(warehouse.created_at), "dd/MM/yyyy")}
                    </div>
                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EditWarehouseDialog
        warehouse={editingWarehouse}
        open={!!editingWarehouse}
        onOpenChange={(o) => !o && setEditingWarehouse(null)}
      />
    </div>
  );
};

export default Warehouses;