import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Wrench, Package, AlertTriangle } from "lucide-react";
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductsTable } from "@/components/products/ProductsTable";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { StatCard } from "@/components/common/StatCard";

const CadastroFerramentas = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { warehouseFilter } = useWarehouseFilterStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [restockProduct, setRestockProduct] = useState<any>(null);
  const search = useSearch({ strict: false }) as { restock?: string };
  const navigate = useNavigate();


  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products-tools', warehouseFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name, type),
          warehouses(name)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Filtrar apenas ferramentas
      return data?.filter(p => p.categories?.type === 'tool');
    }
  });

  useEffect(() => {
    if (!search.restock || !products) return;
    const target = products.find((p) => p.id === search.restock);
    if (target) {
      setRestockProduct(target);
      setSelectedProduct(null);
      setIsDialogOpen(true);
    }
  }, [search.restock, products]);

  const clearRestockParam = () => {
    if (search.restock) {
      navigate({ to: '/cadastro-ferramentas', search: {} as any, replace: true });
    }
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = warehouseFilter === 'all' || p.warehouse_id === warehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  const stats = {
    total: filteredProducts?.length || 0,
    lowStock: filteredProducts?.filter(p => (p.min_stock || 0) > 0 && (p.current_stock || 0) <= (p.min_stock || 0)).length || 0,
    inUse: 0
  };


  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <PageHeader
        icon={<Wrench />}
        iconClassName="text-indigo-600"
        title="Cadastro de Ferramentas"
        description="Gerenciamento de ferramentas manuais e elétricas."
        actions={
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 h-11 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 font-bold w-full md:w-auto"
            onClick={() => {
              setSelectedProduct(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-5 w-5" /> Nova Ferramenta
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="Total de Itens" value={stats.total} icon={<Package size={24} />} tone="indigo" />
        <StatCard label="Estoque Crítico" value={stats.lowStock} icon={<AlertTriangle size={24} />} tone="amber" />
        <StatCard label="Avariados" value={0} icon={<AlertTriangle size={24} />} tone="rose" />
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar por nome, marca ou SKU..."
      />



      <ProductsTable
        products={filteredProducts || []}
        isLoading={isLoading}
        accentColor="indigo"
        emptyLabel="Nenhuma ferramenta encontrada."
        onChanged={refetch}
        onEdit={(p) => {
          setRestockProduct(null);
          setSelectedProduct(p);
          setIsDialogOpen(true);
        }}
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(o) => {
          setIsDialogOpen(o);
          if (!o) {
            setRestockProduct(null);
            setSelectedProduct(null);
            clearRestockParam();
          }
        }}
      >
        <DialogContent className="w-full max-w-full h-[100dvh] rounded-none sm:w-[min(640px,calc(100vw-32px))] sm:max-w-[640px] sm:max-h-[calc(100dvh-32px)] sm:h-auto sm:rounded-[32px] p-0 gap-0 border-none shadow-2xl flex flex-col overflow-hidden min-w-0">
          <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shrink-0 min-w-0">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <DialogHeader className="relative space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 shrink-0">
                  <Wrench size={18} className="text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-100 truncate">
                  {restockProduct ? 'Reposição' : selectedProduct ? 'Edição' : 'Novo Item'}
                </span>
              </div>
              <DialogTitle className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight line-clamp-2 break-words min-w-0">
                {restockProduct
                  ? `Repor: ${restockProduct.name}`
                  : selectedProduct
                  ? 'Editar Ferramenta'
                  : 'Adicionar Ferramenta'}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
            <ProductForm
              product={selectedProduct}
              restockProduct={restockProduct}
              defaultType="tool"
              onSuccess={() => {
                setIsDialogOpen(false);
                setRestockProduct(null);
                setSelectedProduct(null);
                clearRestockParam();
                refetch();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default CadastroFerramentas;
