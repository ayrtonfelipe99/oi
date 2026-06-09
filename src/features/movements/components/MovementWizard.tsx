import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StepIdentifyStaff, type StaffRecord } from './StepIdentifyStaff';
import { StepPickItems, type ItemLine } from './StepPickItems';
import { StepSignAndConfirm } from './StepSignAndConfirm';
import { ArrowDownToLine, ArrowUpFromLine, HardHat, Wrench } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'epi' | 'tool';
  type: 'out' | 'return';
  onCompleted?: () => void;
}

export const MovementWizard = ({ open, onOpenChange, kind, type, onCompleted }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [items, setItems] = useState<ItemLine[]>([]);

  const reset = () => {
    setStep(1);
    setStaff(null);
    setItems([]);
  };

  const handleOpen = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const KindIcon = kind === 'epi' ? HardHat : Wrench;
  const TypeIcon = type === 'out' ? ArrowUpFromLine : ArrowDownToLine;
  const kindLabel = kind === 'epi' ? 'EPIs' : 'Ferramentas';
  const typeLabel = type === 'out' ? 'Saída' : 'Devolução';

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 bg-gradient-to-br from-slate-900 to-slate-700 text-white">
          <DialogTitle className="flex items-center gap-2 text-white">
            <TypeIcon size={18} />
            {typeLabel} de {kindLabel}
            <span className="ml-auto text-xs font-medium opacity-70 flex items-center gap-1">
              <KindIcon size={14} /> Etapa {step} de 3
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="p-5">
          {step === 1 && (
            <StepIdentifyStaff
              onConfirm={(s) => {
                setStaff(s);
                setStep(2);
              }}
            />
          )}
          {step === 2 && staff && (
            <StepPickItems
              kind={kind}
              type={type}
              staff={staff}
              onBack={() => setStep(1)}
              onContinue={(its) => {
                setItems(its);
                setStep(3);
              }}
            />
          )}
          {step === 3 && staff && (
            <StepSignAndConfirm
              kind={kind}
              type={type}
              staff={staff}
              items={items}
              onBack={() => setStep(2)}
              onDone={() => {
                handleOpen(false);
                onCompleted?.();
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
