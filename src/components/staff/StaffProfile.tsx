import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Package,
  Wrench,
  Undo2,
  ClipboardCheck,
  User,
  GraduationCap,
  Trash2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Printer,
  CreditCard,
  Download,
  Clock,
  QrCode,
  Fingerprint,
  Briefcase,
  Target,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface StaffProfileProps {
  staff: any;
  onClose: () => void;
}

export function StaffProfile({ staff }: StaffProfileProps) {
  const { data: staffTrainings } = useQuery({
    queryKey: ['staff-trainings', staff.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_trainings')
        .select('*, trainings(name)')
        .eq('staff_id', staff.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: creator } = useQuery({
    queryKey: ['staff-creator', staff.created_by],
    enabled: !!staff.created_by,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', staff.created_by)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: equipment, refetch: refetchEquipment } = useQuery({
    queryKey: ['staff-equipment', staff.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_equipment')
        .select('*, equipment_types(name, category, ca_number)')
        .eq('staff_id', staff.id);
      if (error) throw error;
      return data;
    },
  });

  const downloadNR6Template = () => {
    const epis = equipment?.filter((e) => e.equipment_types?.category === 'epi') || [];
    const header = [
      ["CONTROLE INDIVIDUAL DE ENTREGA DE EPI - NR-6"],
      [""],
      ["DADOS DO COLABORADOR"],
      ["Nome:", staff.full_name, "", "Matrícula:", staff.registration_number || "-"],
      ["Cargo:", staff.role || "-", "", "Admissão:", staff.admission_date ? format(new Date(staff.admission_date), 'dd/MM/yyyy') : "-"],
      ["CPF:", staff.cpf || "-", "", "O.S.:", staff.cost_center || "-"],
      [""],
      ["TERMO DE RESPONSABILIDADE"],
      ["Recebi da empresa os EPIs abaixo relacionados, novos e em perfeitas condições de uso, "],
      ["obrigando-me a utilizá-los apenas para os fins a que se destinam, responsabilizando-me "],
      ["pela sua guarda e conservação. Comprometo-me a devolvê-los quando solicitado ou no "],
      ["ato do meu desligamento, bem como comunicar qualquer alteração que os torne impróprios para uso."],
      [""],
      ["REGISTRO DE ENTREGAS"],
      ["DATA", "DESCRIÇÃO DO EQUIPAMENTO", "CA", "QTD", "ASSINATURA"],
    ];
    const rows = epis.map((item) => [
      format(new Date(item.issue_date), 'dd/MM/yyyy'),
      item.equipment_types?.name,
      item.equipment_types?.ca_number || "-",
      item.quantity,
      "________________________",
    ]);
    const footer = [
      [""],
      ["__________________________________________"],
      ["Assinatura do Colaborador"],
      ["Data: " + format(new Date(), 'dd/MM/yyyy')],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, ...footer]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ficha NR-6");
    XLSX.writeFile(wb, `Ficha_NR6_${staff.full_name.replace(/\s+/g, '_')}.xlsx`);
    toast.success("Modelo NR-6 gerado com sucesso!");
  };

  const returnMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_equipment')
        .update({ status: 'returned', return_date: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item devolvido com sucesso!");
      refetchEquipment();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído!");
      refetchEquipment();
    },
  });

  const epis = equipment?.filter((e) => e.equipment_types?.category === 'epi' && e.status === 'issued') || [];
  const tools = equipment?.filter((e) => e.equipment_types?.category === 'tool' && e.status === 'issued') || [];
  const returnedItems = equipment?.filter((e) => e.status === 'returned') || [];

  const statusBadge =
    staff.status === 'active'
      ? { text: '● ATIVO', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' }
      : staff.status === 'away'
      ? { text: 'AFASTADO', cls: 'bg-amber-500/20 text-amber-300 border-amber-400/30' }
      : { text: 'DESLIGADO', cls: 'bg-rose-500/20 text-rose-300 border-rose-400/30' };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start p-0 sm:p-5 lg:p-8 w-[96%] max-w-[1600px] mx-auto min-w-0 overflow-x-hidden">
      {/* Left column */}
      <div className="w-full lg:w-[340px] xl:w-[380px] space-y-4 flex-shrink-0 min-w-0">
        {/* Hero */}
        <Card className="overflow-hidden border-none rounded-3xl shadow-xl bg-white w-full min-w-0">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-6 sm:px-6 sm:py-7 text-white">
            <div className="flex items-center justify-between gap-3 mb-5 min-w-0">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 min-w-0">
                <p className="text-[9px] font-black tracking-[0.2em] text-white/50 leading-none mb-1">CÓDIGO</p>
                <p className="text-xs font-mono font-bold leading-none truncate">{staff.registration_number || '0000'}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 font-black text-[9px] tracking-[0.2em] uppercase shrink-0",
                  statusBadge.cls,
                )}
              >
                {statusBadge.text}
              </Badge>
            </div>

            <div className="flex flex-col items-center text-center gap-3 min-w-0">
              <div
                className="rounded-2xl bg-white/10 border border-white/15 overflow-hidden shadow-lg shrink-0"
                style={{ width: 'clamp(88px, 24vw, 120px)', height: 'clamp(88px, 24vw, 120px)' }}
              >
                {staff.photo_url ? (
                  <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="w-full min-w-0 px-2">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-tight break-words">
                  {staff.full_name}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1.5 text-blue-300 min-w-0">
                  <Briefcase size={12} className="shrink-0" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] truncate max-w-full">
                    {staff.role || 'Cargo não definido'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            {/* QR card */}
            <div className="flex flex-col items-center gap-3 py-4 px-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 min-w-0">
              <div
                className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm flex items-center justify-center"
                style={{ width: 'clamp(120px, 42vw, 160px)', height: 'clamp(120px, 42vw, 160px)' }}
              >
                <QRCodeSVG
                  value={staff.registration_number || staff.id}
                  level="M"
                  marginSize={0}
                  className="w-full h-full"
                />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">
                  Autenticação Digital
                </p>
                <p className="text-xs font-mono font-black text-slate-700 truncate">
                  MAT: {staff.registration_number || '-'}
                </p>
              </div>
            </div>


            {/* Control panel */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] shrink-0">
                  Painel de Controle
                </h4>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 min-w-0">
                <QuickActionButton icon={<Printer size={18} />} label="FICHA" color="slate" onClick={downloadNR6Template} />
                <QuickActionButton
                  icon={<CreditCard size={18} />}
                  label="CRACHÁ"
                  color="blue"
                  onClick={() => toast.info("Funcionalidade de gerar crachá em desenvolvimento.")}
                />
                <QuickActionButton
                  icon={<FileText size={18} />}
                  label="REG. SAÍDA"
                  color="indigo"
                  onClick={() => {
                    const epiTab = document.querySelector('[value="epi"]') as HTMLElement;
                    if (epiTab) epiTab.click();
                  }}
                />
                <QuickActionButton
                  icon={<Undo2 size={18} />}
                  label="REG. VOLTA"
                  color="orange"
                  onClick={() => {
                    const toolTab = document.querySelector('[value="ferramentas"]') as HTMLElement;
                    if (toolTab) toolTab.click();
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right column */}
      <div className="flex-1 w-full min-w-0">
        <Tabs defaultValue="geral" className="w-full min-w-0">
          <TabsList className="flex w-full max-w-full h-auto bg-white/80 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl mb-5 shadow-sm border border-slate-100 justify-between gap-1 min-w-0">
            {[
              { v: 'geral', icon: <User size={16} />, label: 'Geral' },
              { v: 'epi', icon: <Package size={16} />, label: 'EPIs' },
              { v: 'ferramentas', icon: <Wrench size={16} />, label: 'Ferr.' },
              { v: 'cursos', icon: <GraduationCap size={16} />, label: 'Cursos' },
              { v: 'historico', icon: <Clock size={16} />, label: 'Hist.' },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                aria-label={t.label}
                className="flex-1 min-w-0 min-h-10 px-1 sm:px-3 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow gap-1.5 text-[11px] sm:text-sm font-bold flex items-center justify-center"
              >
                {t.icon}
                <span className="hidden sm:inline truncate">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>



          {/* GERAL */}
          <TabsContent value="geral" className="mt-0 space-y-4 min-w-0">
            <Card className="p-4 sm:p-7 rounded-3xl border-none shadow-md bg-white w-full min-w-0 border-t-4 border-t-slate-900">
              <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                    Ficha Cadastral
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Controle Interno de Pessoal
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                  <FileText size={18} className="text-slate-400" />
                </div>
              </div>

              <div
                className="grid gap-2 w-full min-w-0"

                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))' }}
              >
                <DetailItem label="Nome Completo" value={staff.full_name} icon={<User size={14} />} />
                <DetailItem label="Matrícula" value={staff.registration_number || '-'} icon={<Fingerprint size={14} />} />
                <DetailItem label="CPF" value={staff.cpf || '-'} icon={<FileText size={14} />} />
                <DetailItem label="Cargo / Função" value={staff.role || '-'} icon={<Briefcase size={14} />} />
                <DetailItem label="Departamento" value={staff.department || '-'} icon={<Building2 size={14} />} />
                <DetailItem
                  label="Data de Admissão"
                  value={staff.admission_date ? format(new Date(staff.admission_date), 'dd/MM/yyyy') : '-'}
                  icon={<Calendar size={14} />}
                />
                <DetailItem label="Telefone" value={staff.phone || '-'} icon={<Phone size={14} />} />
                <DetailItem label="E-mail" value={staff.email || '-'} icon={<Mail size={14} />} />
                <DetailItem label="CC (O.S.)" value={staff.cost_center || '-'} icon={<Target size={14} />} />
                <DetailItem label="Endereço" value={staff.address || '-'} icon={<MapPin size={14} />} />
              </div>

              {staff.notes && (
                <div className="mt-6 pt-6 border-t border-slate-100 min-w-0">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">
                    Observações Internas
                  </p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl italic break-words">
                    "{staff.notes}"
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* EPIs */}
          <TabsContent value="epi" className="mt-0 space-y-4 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
              <StatCard label="EPIs em Posse" value={epis.length} color="blue" />
              <StatCard
                label="Total Devolvido"
                value={returnedItems.filter((e) => e.equipment_types?.category === 'epi').length}
                color="emerald"
              />
              <StatCard label="Pendências" value={0} color="red" />
            </div>

            <SectionCard title="Equipamentos de Proteção em Uso">
              <EquipmentList
                items={epis}
                onReturn={(id: string) => returnMutation.mutate(id)}
                onDelete={(id: string) => deleteMutation.mutate(id)}
                emptyText="Nenhum EPI em uso no momento."
              />
            </SectionCard>

            <SectionCard title="Histórico de EPIs Devolvidos">
              <EquipmentList
                items={returnedItems.filter((e: any) => e.equipment_types?.category === 'epi')}
                isHistory
                onDelete={(id: string) => deleteMutation.mutate(id)}
                emptyText="Nenhuma devolução registrada."
              />
            </SectionCard>
          </TabsContent>

          {/* Ferramentas */}
          <TabsContent value="ferramentas" className="mt-0 space-y-4 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
              <StatCard label="Ferramentas em Posse" value={tools.length} color="indigo" />
              <StatCard
                label="Total Devolvido"
                value={returnedItems.filter((e) => e.equipment_types?.category === 'tool').length}
                color="emerald"
              />
              <StatCard label="Avarias" value={0} color="orange" />
            </div>

            <SectionCard title="Ferramentas em Uso">
              <EquipmentList
                items={tools}
                onReturn={(id: string) => returnMutation.mutate(id)}
                onDelete={(id: string) => deleteMutation.mutate(id)}
                emptyText="Nenhuma ferramenta em uso no momento."
              />
            </SectionCard>

            <SectionCard title="Histórico de Ferramentas Devolvidas">
              <EquipmentList
                items={returnedItems.filter((e: any) => e.equipment_types?.category === 'tool')}
                isHistory
                onDelete={(id: string) => deleteMutation.mutate(id)}
                emptyText="Nenhuma devolução registrada."
              />
            </SectionCard>
          </TabsContent>

          {/* Cursos */}
          <TabsContent value="cursos" className="mt-0 space-y-4 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
              <StatCard label="Cursos Concluídos" value={staffTrainings?.length || 0} color="emerald" />
              <StatCard label="Cursos Válidos" value={staffTrainings?.length || 0} color="blue" />
              <StatCard label="Vencendo" value={0} color="orange" />
            </div>

            <div className="grid grid-cols-1 gap-3 min-w-0">
              {staffTrainings?.map((t) => (
                <Card
                  key={t.id}
                  className="p-4 sm:p-5 rounded-2xl border-slate-100 shadow-sm hover:border-blue-100 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                      <ClipboardCheck size={22} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 leading-tight break-words">{t.trainings?.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 min-w-0">
                        <Calendar size={12} className="shrink-0" />
                        <span className="truncate">
                          Concluído em: {format(new Date(t.completion_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full px-3 font-bold">
                      VÁLIDO
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Baixar certificado"
                      className="text-slate-400 hover:text-blue-600 rounded-full"
                    >
                      <Download size={18} />
                    </Button>
                  </div>
                </Card>
              ))}
              {(!staffTrainings || staffTrainings.length === 0) && (
                <EmptyState
                  icon={<GraduationCap size={40} />}
                  text="Nenhum curso cadastrado para este colaborador."
                />
              )}
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico" className="mt-0 min-w-0">
            <Card className="p-5 sm:p-7 rounded-3xl border-slate-100 shadow-sm w-full min-w-0">
              <div className="space-y-6 min-w-0">
                <TimelineItem
                  title="Colaborador Cadastrado"
                  desc={
                    creator
                      ? `Cadastrado por ${creator.full_name || 'Usuário'}${creator.email ? ` (${creator.email})` : ''}.`
                      : 'Cadastro realizado no sistema.'
                  }
                  date={
                    staff.created_at
                      ? format(new Date(staff.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '-'
                  }
                  icon={<User size={14} />}
                  color="blue"
                  isLast
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  actionLabel,
  actionColor,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  actionColor?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl overflow-hidden border-slate-100 shadow-sm w-full min-w-0">
      <div className="p-4 sm:p-5 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base break-words min-w-0">{title}</h3>
        {actionLabel && (
          <Button
            size="sm"
            onClick={onAction}
            className={cn("w-full sm:w-auto rounded-full px-4 h-9 shadow-md text-white shrink-0", actionColor)}
          >
            <Plus size={16} className="mr-2" /> {actionLabel}
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
}

function EquipmentList({
  items,
  onReturn,
  onDelete,
  isHistory = false,
  emptyText = "Nenhum registro encontrado.",
}: any) {
  if (!items || items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState icon={<Package size={36} />} text={emptyText} />
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {items.map((item: any) => (
          <div key={item.id} className="p-4 space-y-3 min-w-0">
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <p className="font-bold text-slate-700 break-words">{item.equipment_types?.name}</p>
                <p className="text-[10px] uppercase font-medium text-slate-400 mt-0.5">
                  {item.equipment_types?.category}
                </p>
              </div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg font-bold shrink-0">
                {item.quantity} un
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">
                {isHistory ? 'Devolvido' : 'Entregue'} em{' '}
                {format(new Date(isHistory ? item.return_date : item.issue_date), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex gap-2">
              {!isHistory && onReturn && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReturn(item.id)}
                  className="flex-1 h-9 rounded-lg text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[11px] font-bold"
                >
                  DEVOLVER
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir registro"
                onClick={() => onDelete(item.id)}
                className="h-9 w-9 text-slate-400 hover:text-red-500 rounded-lg shrink-0"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block w-full max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12">
                Equipamento
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12">
                Qtd
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12">
                Data {isHistory ? 'Devolução' : 'Entrega'}
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12 text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => (
              <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/30">
                <TableCell>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-700 break-words">{item.equipment_types?.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      {item.equipment_types?.category}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg font-bold">
                    {item.quantity} un
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-slate-300" />
                    {format(new Date(isHistory ? item.return_date : item.issue_date), 'dd/MM/yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!isHistory && onReturn && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReturn(item.id)}
                        className="h-8 rounded-lg text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[10px] font-bold"
                      >
                        DEVOLVER
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir registro"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-10 px-4 bg-white border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-3 min-w-0">
      <div className="p-3 bg-slate-50 rounded-full text-slate-300">{icon}</div>
      <p className="text-slate-400 font-medium text-sm break-words">{text}</p>
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'indigo' | 'orange' | 'slate';
  onClick?: () => void;
}) {
  const themes = {
    blue: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
    indigo: "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200",
    orange: "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200",
    slate: "hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200",
  } as const;
  const iconBg = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-100 text-slate-700",
  } as const;
  return (
    <Button
      variant="outline"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-2xl h-auto min-h-[88px] py-3 flex-col gap-2 text-[10px] font-black border-slate-100 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full min-w-0",
        themes[color],
      )}
    >
      <div className={cn("p-2 rounded-xl", iconBg[color])}>{icon}</div>
      <span className="truncate max-w-full">{label}</span>
    </Button>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50/60 border border-slate-100 rounded-xl min-w-0 hover:border-blue-200 hover:bg-white transition-all">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shrink-0 border border-slate-100">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em] leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}


function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'red' | 'indigo' | 'orange';
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  } as const;
  return (
    <Card className={cn("p-3 sm:p-4 rounded-2xl border flex flex-col gap-1 shadow-sm min-w-0", colors[color])}>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-80 truncate">{label}</span>
      <span className="text-xl sm:text-2xl font-black">{value}</span>
    </Card>
  );
}

function TimelineItem({ title, desc, date, icon, color, isLast = false }: any) {
  const colorMap = {
    blue: "bg-blue-500 shadow-blue-200",
    emerald: "bg-emerald-500 shadow-emerald-200",
    indigo: "bg-indigo-500 shadow-indigo-200",
    orange: "bg-orange-500 shadow-orange-200",
  } as const;
  return (
    <div className="flex gap-4 relative min-w-0">
      {!isLast && <div className="absolute left-3.5 top-8 bottom-[-24px] w-px bg-slate-100" />}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg relative z-10 shrink-0",
          colorMap[color as keyof typeof colorMap],
        )}
      >
        {icon}
      </div>
      <div className="pb-6 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h5 className="text-sm font-black text-slate-800 break-words">{title}</h5>
          <span className="text-[10px] font-bold text-slate-400">{date}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1 break-words">{desc}</p>
      </div>
    </div>
  );
}
