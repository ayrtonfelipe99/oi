import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { QrCode, User, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { QrScanner } from './QrScanner';
import { toast } from 'sonner';

export interface StaffRecord {
  id: string;
  full_name: string;
  registration_number: string;
  role?: string | null;
  contract_id?: string | null;
}

interface Props {
  onConfirm: (staff: StaffRecord) => void;
}

export const StepIdentifyStaff = ({ onConfirm }: Props) => {
  const [matricula, setMatricula] = useState('');
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const lookup = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('id, full_name, registration_number, role, contract_id')
      .eq('registration_number', value.trim())
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast.error('Erro ao buscar colaborador');
      return;
    }
    if (!data) {
      toast.error('Colaborador não encontrado');
      setStaff(null);
      return;
    }
    setStaff(data as StaffRecord);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-slate-900">Identificar Colaborador</h3>
        <p className="text-sm text-slate-500">Escaneie o QR Code, leia o código de barras ou digite a matrícula.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(matricula);
        }}
        className="flex gap-2"
      >
        <Input
          ref={inputRef}
          placeholder="Matrícula"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          className="h-12 text-base"
          autoComplete="off"
        />
        <Button type="submit" className="h-12 px-5" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 px-5"
          onClick={() => setScannerOpen(true)}
        >
          <QrCode />
        </Button>
      </form>

      {staff && (
        <Card className="p-4 border-emerald-200 bg-emerald-50/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
            <User />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 truncate">{staff.full_name}</p>
            <p className="text-xs text-slate-500">
              Matrícula {staff.registration_number}
              {staff.role && ` · ${staff.role}`}
            </p>
          </div>
          <CheckCircle2 className="text-emerald-600" />
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button
          disabled={!staff}
          onClick={() => staff && onConfirm(staff)}
          className="h-11 px-6"
        >
          Continuar
        </Button>
      </div>

      {scannerOpen && (
        <QrScanner
          onResult={(value) => {
            setScannerOpen(false);
            setMatricula(value);
            lookup(value);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
};
