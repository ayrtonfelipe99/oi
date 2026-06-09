import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings as SettingsIcon, 
  Layers, 
  Plus, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppLayout from '@/components/layout/AppLayout';

const Settings = () => {
  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error("Erro ao excluir categoria: " + error.message);
    } else {
      toast.success("Categoria excluída com sucesso!");
      refetch();
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Configurações</h1>
          <p className="text-slate-500 font-medium text-sm">Gerencie os parâmetros do sistema.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="text-blue-600" size={20} />
              <CardTitle className="text-xl font-black text-slate-900 uppercase">Categorias (EPIs e Ferramentas)</CardTitle>
            </div>
          </div>
          <CardDescription className="font-medium">
            Gerencie as categorias utilizadas para organizar seus materiais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-2xl" />
              ))
            ) : categories?.map((cat) => (
              <div 
                key={cat.id} 
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${cat.type === 'epi' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Layers size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase font-black tracking-widest mt-1">
                      {cat.type === 'epi' ? 'EPI' : 'FERRAMENTA'}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="font-black text-blue-900 uppercase tracking-tight">Dica de Organização</p>
                <p className="text-blue-700/70 text-sm font-medium">As categorias pré-cadastradas ajudam a manter o estoque organizado e facilitam a filtragem no dashboard.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
