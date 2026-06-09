import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EditWarehouseDialogProps {
  warehouse: { id: string; name: string; location?: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditWarehouseDialog: React.FC<EditWarehouseDialogProps> = ({
  warehouse,
  open,
  onOpenChange,
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name || '');
      setLocation(warehouse.location || '');
    }
  }, [warehouse]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!warehouse) throw new Error('Almoxarifado não encontrado');
      const { error } = await supabase
        .from('warehouses')
        .update({ name, location })
        .eq('id', warehouse.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Almoxarifado atualizado!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('O nome é obrigatório');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Almoxarifado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Almoxarifado</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-location">Localização / Endereço</Label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
