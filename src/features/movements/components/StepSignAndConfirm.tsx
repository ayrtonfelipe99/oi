import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Eraser, CheckCircle2, Loader2 } from 'lucide-react';
import type { StaffRecord } from './StepIdentifyStaff';
import type { ItemLine } from './StepPickItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  kind: 'epi' | 'tool';
  type: 'out' | 'return';
  staff: StaffRecord;
  items: ItemLine[];
  onBack: () => void;
  onDone: () => void;
}

export const StepSignAndConfirm = ({ kind, type, staff, items, onBack, onDone }: Props) => {
  const sigRef = useRef<SignatureCanvas>(null);
  const [submitting, setSubmitting] = useState(false);

  const clear = () => sigRef.current?.clear();

  const submit = async () => {
    if (sigRef.current?.isEmpty()) {
      toast.error('Assinatura obrigatória');
      return;
    }
    setSubmitting(true);
    try {
      const dataUrl = sigRef.current!.getTrimmedCanvas().toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const groupId = crypto.randomUUID();
      const path = `${staff.id}/${groupId}.png`;
      const { error: upErr } = await supabase.storage
        .from('signatures')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (upErr) throw upErr;

      const { data: userRes } = await supabase.auth.getUser();
      const clerkId = userRes.user?.id ?? null;

      const rows = items.map((i) => ({
        type,
        product_id: i.productId,
        staff_id: staff.id,
        warehouse_id: i.warehouseId,
        quantity: i.quantity,
        clerk_id: clerkId,
        status: 'completed',
        signature_url: path,
        movement_group_id: groupId,
        material_kind: kind,
        notes: type === 'out' ? 'Saída de material' : 'Devolução de material',
      }));

      const { error: insErr } = await supabase.from('transactions').insert(rows);
      if (insErr) throw insErr;

      // Atomic stock adjustments to avoid race conditions
      await Promise.all(
        items.map((i) => {
          const delta = type === 'out' ? -i.quantity : i.quantity;
          return supabase.rpc('adjust_stock' as any, {
            p_product_id: i.productId,
            p_delta: delta,
          });
        })
      );


      toast.success(type === 'out' ? 'Saída registrada com sucesso' : 'Devolução registrada com sucesso');
      onDone();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao registrar movimentação');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Confirmar e assinar</h3>
          <p className="text-sm text-slate-500">
            {staff.full_name} · {items.length} {items.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </Button>
      </div>

      <Card className="p-3 max-h-40 overflow-auto">
        <ul className="text-sm divide-y">
          {items.map((i) => (
            <li key={i.productId} className="py-1.5 flex justify-between gap-3">
              <span className="line-clamp-1 flex-1">{i.name}</span>
              <strong className="text-slate-700">×{i.quantity}</strong>
            </li>
          ))}
        </ul>
      </Card>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
          Assine abaixo com o dedo
        </p>
        <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="#0f172a"
            canvasProps={{ className: 'w-full h-44 touch-none' }}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={clear} className="mt-1">
          <Eraser size={14} className="mr-1" /> Limpar assinatura
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={submit} disabled={submitting} className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700">
          {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={16} />}
          {type === 'out' ? 'Confirmar Saída' : 'Confirmar Devolução'}
        </Button>
      </div>
    </div>
  );
};
