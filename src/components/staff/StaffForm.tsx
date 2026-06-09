import React from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, 
  Loader2, 
  Plus, 
  Trash2, 
  GraduationCap, 
  User, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin,
  Building2,
  Image as ImageIcon,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useServiceOrderStore } from "@/hooks/use-service-order-store";

const trainingSchema = z.object({
  training_id: z.string().min(1, "Selecione o treinamento"),
  completion_date: z.date({
    required_error: "A data é obrigatória",
  }),
});

const staffSchema = z.object({
  full_name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  registration_number: z.string().min(1, "A matrícula é obrigatória"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  role: z.string().optional(),
  role_id: z.string().min(1, "O cargo é obrigatório"),
  status: z.string().min(1, "O status é obrigatório"),
  contract_id: z.string().nullable().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").or(z.literal("")),
  address: z.string().optional(),
  admission_date: z.date().optional().nullable(),
  photo_url: z.string().optional(),
  notes: z.string().optional(),
  cost_center: z.string().optional(),
  trainings: z.array(trainingSchema),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffFormProps {
  onSuccess?: () => void;
  staff?: any;
}

export function StaffForm({ onSuccess, staff }: StaffFormProps) {
  const queryClient = useQueryClient();
  const { selectedSoId } = useServiceOrderStore();
  
  const { data: activeOS } = useQuery({
    queryKey: ['active-os', selectedSoId],
    queryFn: async () => {
      if (!selectedSoId) return null;
      const { data, error } = await supabase
        .from('service_orders')
        .select('id, order_number, title')
        .eq('id', selectedSoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSoId
  });

  const { data: trainingTypes } = useQuery({
    queryKey: ['training-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trainings').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: jobRoles } = useQuery({
    queryKey: ['job_roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('job_roles').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });


  const { data: staffTrainings } = useQuery({
    queryKey: ['staff-trainings', staff?.id],
    queryFn: async () => {
      if (!staff?.id) return [];
      const { data, error } = await supabase
        .from('staff_trainings')
        .select('training_id, completion_date')
        .eq('staff_id', staff.id);
      if (error) throw error;
      return data.map(t => ({
        training_id: t.training_id,
        completion_date: new Date(t.completion_date)
      }));
    },
    enabled: !!staff?.id
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: staff?.full_name || "",
      registration_number: staff?.registration_number || "",
      cpf: staff?.cpf || "",
      role: staff?.role || "",
      role_id: staff?.role_id || "",
      status: staff?.status || "active",
      contract_id: staff?.contract_id || (selectedSoId || null),
      department: staff?.department || "",
      phone: staff?.phone || "",
      email: staff?.email || "",
      address: staff?.address || "",
      admission_date: staff?.admission_date ? new Date(staff.admission_date) : null,
      photo_url: staff?.photo_url || "",
      notes: staff?.notes || "",
      cost_center: staff?.cost_center || "",
      trainings: [],
    },
  });

  React.useEffect(() => {
    if (staffTrainings && staffTrainings.length > 0) {
      const sanitizedTrainings = staffTrainings.map(t => ({
        training_id: t.training_id as string,
        completion_date: t.completion_date
      }));
      form.setValue('trainings', sanitizedTrainings);
    }
  }, [staffTrainings, form]);

  // Auto-preencher O.S. com a ordem de serviço selecionada (padrão)
  React.useEffect(() => {
    if (!staff && activeOS?.title && !form.getValues('cost_center')) {
      form.setValue('cost_center', activeOS.title);
      form.setValue('contract_id', activeOS.id);
    }
  }, [activeOS, staff, form]);




  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "trainings",
  });

  const mutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      const { trainings, ...staffData } = values;
      
      let staffId = staff?.id;

      // Update role string based on selected role_id
      const selectedRole = jobRoles?.find(r => r.id === values.role_id);
      
      const payload: any = {
        ...staffData,
        role: selectedRole?.name || "",
        admission_date: staffData.admission_date ? format(staffData.admission_date, 'yyyy-MM-dd') : null,
      };

      if (staffId) {
        const { error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', staffId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('staff')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        staffId = data.id;
      }


      if (staff?.id) {
        const { error: deleteError } = await supabase
          .from('staff_trainings')
          .delete()
          .eq('staff_id', staffId);
        if (deleteError) throw deleteError;
      }

      if (trainings && trainings.length > 0) {
        const trainingPayload = trainings.map(t => ({
          staff_id: staffId,
          training_id: t.training_id,
          completion_date: format(t.completion_date, 'yyyy-MM-dd')
        }));

        const { error: insertError } = await supabase
          .from('staff_trainings')
          .insert(trainingPayload);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-trainings'] });
      toast.success(staff ? "Colaborador atualizado com sucesso!" : "Colaborador cadastrado com sucesso!");
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar colaborador: " + error.message);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-8 pt-4">
        {/* Seção Dados Pessoais */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-blue-700 border-b border-blue-50 pb-2">
            <User size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">Dados Pessoais</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="pl-10 rounded-xl" placeholder="Ex: João da Silva" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Foto</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="pl-10 rounded-xl" placeholder="https://..." {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl" placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="pl-10 rounded-xl" placeholder="(00) 00000-0000" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input className="pl-10 rounded-xl" placeholder="exemplo@empresa.com" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço Residencial</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input className="pl-10 rounded-xl" placeholder="Rua, Número, Bairro, Cidade - UF" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção Profissional */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-indigo-700 border-b border-indigo-50 pb-2">
            <Briefcase size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">Informações Profissionais</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="registration_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl font-mono font-bold" placeholder="000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo / Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione a função..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      {jobRoles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor / Departamento</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="pl-10 rounded-xl" placeholder="Ex: Logística" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Contratual</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Desligado</SelectItem>
                      <SelectItem value="away">Afastado</SelectItem>
                      <SelectItem value="vacation">Férias</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="admission_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="mb-2">Data de Admissão</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal rounded-xl h-10",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecionar data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost_center"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O.S.</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                      <Input
                        className="pl-10 rounded-xl font-bold"
                        placeholder={activeOS ? activeOS.title : "Ex: 173"}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  {activeOS && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      O.S. ativa: <span className="font-bold text-blue-600">{activeOS.title}</span>
                    </p>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>


          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações Internas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Informações relevantes sobre o colaborador..." 
                    className="rounded-xl min-h-[100px] resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Treinamentos */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700">
              <GraduationCap size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wider">Treinamentos e Certificações</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ training_id: "", completion_date: new Date() })}
              className="h-8 rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-4"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex-1 w-full">
                  <FormField
                    control={form.control}
                    name={`trainings.${index}.training_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Treinamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white rounded-xl">
                              <SelectValue placeholder="Selecione o tipo..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {trainingTypes?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full sm:w-[220px]">
                  <FormField
                    control={form.control}
                    name={`trainings.${index}.completion_date`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-400 mb-2">Conclusão</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-white rounded-xl",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-30" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-10 bg-white border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center gap-2">
                <GraduationCap size={32} className="text-slate-200" />
                <p className="text-slate-400 text-sm">Sem treinamentos vinculados</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md py-4 border-t z-20">
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto font-black px-12 h-12 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95" 
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {staff ? "ATUALIZAR COLABORADOR" : "CADASTRAR COLABORADOR"}
          </Button>
        </div>
      </form>
    </Form>
  );
}