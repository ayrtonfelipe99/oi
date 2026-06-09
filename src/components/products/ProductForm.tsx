import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Package,
  Tag,
  Hash,
  Layers,
  ShieldCheck,
  Calendar,
  Warehouse,
  Search,
  Box,
  ArrowLeft,
  Plus,
  AlertCircle,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUserName } from "@/hooks/useCurrentUserName";

interface ProductFormProps {
  onSuccess?: () => void;
  product?: any;
  restockProduct?: any;
  defaultType?: 'epi' | 'tool';
}

export function ProductForm({ onSuccess, product, restockProduct, defaultType }: ProductFormProps) {
  // Modo reposição: adiciona estoque a um produto existente
  if (restockProduct?.id) {
    return <RestockForm product={restockProduct} defaultType={defaultType} onSuccess={onSuccess} />;
  }
  // Edit mode → keep old full form
  if (product?.id) {
    return <EditProductForm product={product} defaultType={defaultType} onSuccess={onSuccess} />;
  }
  return <QuickAddFromModel defaultType={defaultType} onSuccess={onSuccess} />;
}

/* ============================================================
   QUICK ADD: 2-step wizard (select model → quantity/warehouse)
   ============================================================ */

const quickSchema = z.object({
  warehouse_id: z.string().min(1, "Selecione o almoxarifado"),
  quantity: z.coerce.number().min(1, "Informe ao menos 1"),
  unit: z.string().min(1),
  min_stock: z.coerce.number().min(0),
  brand: z.string().optional(),
  ca_number: z.string().optional(),
  ca_expiry: z.string().optional(),
  registered_by: z.string().optional(),
});
type QuickValues = z.infer<typeof quickSchema>;

function QuickAddFromModel({
  defaultType,
  onSuccess,
}: { defaultType?: 'epi' | 'tool'; onSuccess?: () => void }) {
  const currentUserName = useCurrentUserName();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [search, setSearch] = useState("");

  const accent = defaultType === 'tool' ? 'indigo' : 'blue';

  const { data: models, isLoading: loadingModels } = useQuery({
    queryKey: ['product_models_quick', defaultType],
    queryFn: async () => {
      let q = supabase
        .from('product_models')
        .select('*, categories!inner(id, name, type)')
        .order('name');
      if (defaultType) q = q.eq('categories.type', defaultType);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const filteredModels = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return models ?? [];
    return (models ?? []).filter((m: any) =>
      m.name?.toLowerCase().includes(s) ||
      m.sku?.toLowerCase().includes(s) ||
      m.item_number?.toLowerCase().includes(s) ||
      m.categories?.name?.toLowerCase().includes(s)
    );
  }, [models, search]);

  const form = useForm<QuickValues>({
    resolver: zodResolver(quickSchema),
    defaultValues: {
      warehouse_id: "",
      quantity: 1,
      unit: "UN",
      min_stock: 0,
      brand: "",
      ca_number: "",
      ca_expiry: "",
      registered_by: "",
    },
  });

  useEffect(() => {
    if (!warehouses?.length) return;

    const currentWarehouseId = form.getValues("warehouse_id");
    if (!currentWarehouseId) {
      form.setValue("warehouse_id", warehouses[0].id, { shouldValidate: true });
    }
  }, [form, warehouses]);

  useEffect(() => {
    if (currentUserName) form.setValue("registered_by", currentUserName);
  }, [form, currentUserName]);


  const mutation = useMutation({
    mutationFn: async (values: QuickValues) => {
      if (!selectedModel) throw new Error("Modelo não selecionado");

      // Try find existing product (same sku + warehouse + categoria) to sum quantity.
      // Filtra por category_id para manter EPI e Ferramenta separados mesmo
      // quando compartilham o mesmo código.
      let existing: any = null;
      if (selectedModel.sku) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('sku', selectedModel.sku)
          .eq('warehouse_id', values.warehouse_id)
          .eq('category_id', selectedModel.category_id)
          .maybeSingle();
        existing = data;
      }


      let productId: string;
      let mode: 'created' | 'updated';

      if (existing) {
        const { error } = await supabase
          .from('products')
          .update({
            current_stock: (existing.current_stock || 0) + values.quantity,
            min_stock: values.min_stock || existing.min_stock,
            unit: values.unit || existing.unit,
            ...(values.brand ? { brand: values.brand } : {}),
            ...(values.ca_number ? { ca_number: values.ca_number } : {}),
            ...(values.ca_expiry ? { ca_expiry: values.ca_expiry } : {}),
          } as any)
          .eq('id', existing.id);
        if (error) throw error;
        productId = existing.id;
        mode = 'updated';
      } else {
        const { data: inserted, error } = await supabase.from('products').insert([{
          name: selectedModel.name,
          sku: selectedModel.sku || null,
          item_number: selectedModel.item_number || null,
          category_id: selectedModel.category_id,
          warehouse_id: values.warehouse_id,
          unit: values.unit,
          current_stock: values.quantity,
          min_stock: values.min_stock,
          brand: values.brand || null,
          ca_number: values.ca_number || null,
          ca_expiry: values.ca_expiry || null,
          registered_by: (values.registered_by || currentUserName || '').trim() || null,
        } as any]).select('id').single();
        if (error) throw error;
        productId = inserted!.id;
        mode = 'created';
      }

      // Registra entrada no histórico de compras
      await (supabase.from('product_purchases') as any).insert([{
        product_id: productId,
        quantity: values.quantity,
        brand: values.brand || null,
        warehouse_id: values.warehouse_id,
        registered_by: (values.registered_by || currentUserName || '').trim() || null,
      }]);

      return { mode, qty: values.quantity };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-epis'] });
      queryClient.invalidateQueries({ queryKey: ['products-tools'] });
      toast.success(
        res.mode === 'updated'
          ? `+${res.qty} adicionados ao estoque existente!`
          : `Item cadastrado com ${res.qty} no estoque!`
      );
      onSuccess?.();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  /* ---------- STEP 1: model picker ---------- */
  if (step === 1) {
    return (
      <div className="flex flex-col h-full min-h-0 min-w-0 w-full max-w-full gap-3 px-4 sm:px-5 py-4">
        <div className="relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Buscar modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 rounded-2xl h-14 text-base bg-slate-50 border-slate-200 focus-visible:bg-white"
            autoFocus
          />
        </div>

        {filteredModels.length > 0 && (
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 shrink-0">
            {filteredModels.length} {filteredModels.length === 1 ? 'modelo' : 'modelos'} disponível{filteredModels.length === 1 ? '' : 'is'}
          </p>
        )}

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 pb-2">
          {loadingModels ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
            ))
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-12 px-6 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
              <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <p className="font-bold text-amber-900">
                {models?.length === 0
                  ? `Nenhum modelo de ${defaultType === 'tool' ? 'ferramenta' : 'EPI'} cadastrado.`
                  : "Nenhum modelo encontrado."}
              </p>
              {models?.length === 0 && (
                <Link
                  to="/settings"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg",
                    accent === 'blue' ? "bg-blue-600 active:bg-blue-700" : "bg-indigo-600 active:bg-indigo-700"
                  )}
                >
                  <SettingsIcon size={14} />
                  Cadastrar modelos
                </Link>
              )}
            </div>
          ) : (
            filteredModels.map((m: any) => (
              <button
                type="button"
                key={m.id}
                onClick={() => {
                  setSelectedModel(m);
                  form.setValue("min_stock", Number(m.min_quantity) || 0, { shouldValidate: true });
                  setStep(2);
                }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border-2 border-slate-100 bg-white active:scale-[0.98] transition-all flex items-center gap-3",
                  accent === 'blue' ? "active:border-blue-300 active:bg-blue-50/50" : "active:border-indigo-300 active:bg-indigo-50/50"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl shrink-0",
                  accent === 'blue' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                )}>
                  <Box size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-[15px] leading-snug line-clamp-2">{m.name}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {m.item_number && (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        #{m.item_number}
                      </span>
                    )}
                    {m.sku && (
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {m.sku}
                      </span>
                    )}
                    {Number(m.min_quantity) > 0 && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        mín. {m.min_quantity}
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "p-2 rounded-full shrink-0",
                  accent === 'blue' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
                )}>
                  <Plus size={16} strokeWidth={3} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  /* ---------- STEP 2: quantity / warehouse ---------- */
  const qty = Number(form.watch("quantity")) || 0;
  const bumpQty = (delta: number) => {
    const next = Math.max(1, qty + delta);
    form.setValue("quantity", next, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col h-full min-h-0 min-w-0 w-full max-w-full px-4 sm:px-5 pt-4"
      >
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4 pb-4">
          <button
            type="button"
            onClick={() => { setStep(1); setSelectedModel(null); }}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 active:text-slate-900 uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Trocar modelo
          </button>

          <div className={cn(
            "p-4 rounded-2xl border-2 flex items-center gap-3",
            accent === 'blue' ? "bg-blue-50/60 border-blue-100" : "bg-indigo-50/60 border-indigo-100"
          )}>
            <div className={cn(
              "p-3 rounded-xl shrink-0",
              accent === 'blue' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
            )}>
              <Box size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 text-sm leading-snug line-clamp-2">{selectedModel?.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {selectedModel?.item_number && (
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    #{selectedModel.item_number}
                  </span>
                )}
                {selectedModel?.sku && (
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {selectedModel.sku}
                  </span>
                )}
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="warehouse_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Almoxarifado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-2xl h-14 text-base bg-slate-50 border-slate-200">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-slate-400" />
                        <SelectValue placeholder="Selecione o local..." />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {warehouses?.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {warehouses?.length === 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-2">
                    Cadastre um almoxarifado antes de adicionar itens.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantity stepper */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Quantidade</FormLabel>
                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-2xl p-2">
                  <button
                    type="button"
                    onClick={() => bumpQty(-1)}
                    className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-700 active:scale-95 transition-transform shrink-0"
                    aria-label="Diminuir"
                  >
                    −
                  </button>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className="flex-1 h-12 border-none bg-transparent text-center text-3xl font-black text-slate-900 focus-visible:ring-0 p-0"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => bumpQty(1)}
                    className={cn(
                      "h-12 w-12 rounded-xl text-white flex items-center justify-center text-2xl font-black active:scale-95 transition-transform shrink-0 shadow-md",
                      accent === 'blue' ? "bg-blue-600" : "bg-indigo-600"
                    )}
                    aria-label="Aumentar"
                  >
                    +
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Unidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="UN">Unidade</SelectItem>
                      <SelectItem value="PR">Par</SelectItem>
                      <SelectItem value="CX">Caixa</SelectItem>
                      <SelectItem value="KG">Quilo</SelectItem>
                      <SelectItem value="MT">Metro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="min_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Estoque mín.</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" min={0} className="rounded-2xl h-14 bg-slate-50 border-slate-200 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Marca (opcional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input className="pl-11 rounded-2xl h-14 bg-slate-50 border-slate-200 text-base" placeholder="Ex: 3M, MSA" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {currentUserName && (
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 px-1">
              <User size={12} className="text-slate-400" />
              Responsável pelo cadastro: <span className="text-slate-800">{currentUserName}</span>
            </p>
          )}



          {defaultType === 'epi' && (
            <div className="space-y-3 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Certificado de Aprovação</p>
              <FormField
                control={form.control}
                name="ca_number"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                        <Input className="pl-11 rounded-2xl h-14 bg-white border-blue-200 text-base" placeholder="Número do CA" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ca_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                        <Input type="date" className="pl-11 rounded-2xl h-14 bg-white border-blue-200 text-base" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-5 px-4 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white to-white/0 shrink-0 min-w-0">
          <Button
            type="submit"
              disabled={mutation.isPending || !warehouses?.length}
            className={cn(
              "w-full h-14 rounded-2xl font-black text-base shadow-xl text-white",
              accent === 'blue'
                ? "bg-blue-600 active:bg-blue-700 shadow-blue-300/50"
                : "bg-indigo-600 active:bg-indigo-700 shadow-indigo-300/50"
            )}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
            ) : (
              <><Plus className="mr-2 h-5 w-5" strokeWidth={3} /> Adicionar {qty > 0 ? `${qty} ` : ''}ao estoque</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}


/* ============================================================
   EDIT MODE: kept simple, edits existing product fields
   ============================================================ */

const editSchema = z.object({
  name: z.string().min(3),
  sku: z.string().optional(),
  item_number: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().min(1),
  category_id: z.string().min(1),
  warehouse_id: z.string().min(1),
  min_stock: z.coerce.number().min(0),
  current_stock: z.coerce.number().min(0),
  ca_number: z.string().optional(),
  ca_expiry: z.string().optional(),
  description: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

function EditProductForm({
  product, defaultType, onSuccess,
}: { product: any; defaultType?: 'epi' | 'tool'; onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      item_number: product?.item_number || "",
      brand: product?.brand || "",
      unit: product?.unit || "UN",
      category_id: product?.category_id || "",
      warehouse_id: product?.warehouse_id || "",
      min_stock: product?.min_stock || 0,
      current_stock: product?.current_stock || 0,
      ca_number: product?.ca_number || "",
      ca_expiry: product?.ca_expiry || "",
      description: product?.description || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: EditValues) => {
      const { error } = await supabase.from('products').update(values).eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-epis'] });
      queryClient.invalidateQueries({ queryKey: ['products-tools'] });
      toast.success("Produto atualizado!");
      onSuccess?.();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const filteredCategories = categories?.filter((c: any) => !defaultType || c.type === defaultType);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="flex flex-col h-full min-h-0 min-w-0 w-full max-w-full">
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 pt-4 pb-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input disabled readOnly className="pl-10 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input disabled readOnly className="pl-10 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={form.control} name="sku" render={({ field }) => (
            <FormItem>
              <FormLabel>Código / SKU</FormLabel>
              <FormControl>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input disabled readOnly className="pl-10 rounded-xl font-mono bg-slate-50 text-slate-500 cursor-not-allowed" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="item_number" render={({ field }) => (
            <FormItem>
              <FormLabel>Nº do Item</FormLabel>
              <FormControl><Input disabled readOnly className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled>
                <FormControl><SelectTrigger className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent className="rounded-xl">
                  <SelectItem value="UN">Unidade (UN)</SelectItem>
                  <SelectItem value="PR">Par (PR)</SelectItem>
                  <SelectItem value="CX">Caixa (CX)</SelectItem>
                  <SelectItem value="KG">Quilo (KG)</SelectItem>
                  <SelectItem value="MT">Metro (MT)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="category_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled>
                <FormControl>
                  <SelectTrigger className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-slate-400" />
                      <SelectValue placeholder="Selecione..." />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  {filteredCategories?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="warehouse_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Almoxarifado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled>
                <FormControl>
                  <SelectTrigger className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-slate-400" />
                      <SelectValue placeholder="Selecione..." />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  {warehouses?.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="min_stock" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-emerald-700 font-bold">Estoque Mínimo</FormLabel>
              <FormControl><Input type="number" className="rounded-xl border-emerald-300 focus-visible:ring-emerald-500" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="current_stock" render={({ field }) => (
            <FormItem>
              <FormLabel>Estoque Atual</FormLabel>
              <FormControl><Input type="number" disabled readOnly className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
        </div>

        {defaultType === 'epi' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <FormField control={form.control} name="ca_number" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-blue-900 font-bold">Número do CA</FormLabel>
                <FormControl>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input disabled readOnly className="pl-10 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed border-blue-200" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="ca_expiry" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-blue-900 font-bold">Vencimento CA</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input type="date" disabled readOnly className="pl-10 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed border-blue-200" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
        )}

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl><Textarea disabled readOnly className="rounded-xl min-h-[100px] bg-slate-50 text-slate-500 cursor-not-allowed" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>

        </div>

        <div className="flex justify-end gap-3 px-4 sm:px-5 py-3 border-t border-slate-200 bg-white shrink-0">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 h-12 px-10 rounded-2xl font-bold shadow-xl shadow-blue-200"
          >
            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Atualizar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* ============================================================
   RESTOCK MODE: adiciona estoque a um produto existente
   ============================================================ */

const restockSchema = z.object({
  quantity: z.coerce.number().min(1, 'Informe ao menos 1'),
  brand: z.string().optional(),
  warehouse_id: z.string().min(1, 'Selecione o almoxarifado'),
  notes: z.string().optional(),
  registered_by: z.string().optional(),
});
type RestockValues = z.infer<typeof restockSchema>;

function RestockForm({
  product,
  defaultType,
  onSuccess,
}: { product: any; defaultType?: 'epi' | 'tool'; onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const accent = defaultType === 'tool' ? 'indigo' : 'blue';
  const currentUserName = useCurrentUserName();


  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const current = Number(product.current_stock) || 0;
  const min = Number(product.min_stock) || 0;
  const suggested = Math.max(1, min - current);

  const form = useForm<RestockValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      quantity: suggested,
      brand: product.brand || '',
      warehouse_id: product.warehouse_id || '',
      notes: '',
      registered_by: '',
    },
  });

  useEffect(() => {
    if (!warehouses?.length) return;
    if (!form.getValues('warehouse_id')) {
      form.setValue('warehouse_id', product.warehouse_id || warehouses[0].id, { shouldValidate: true });
    }
  }, [form, warehouses, product.warehouse_id]);

  useEffect(() => {
    if (currentUserName) form.setValue('registered_by', currentUserName);
  }, [form, currentUserName]);


  const qty = Number(form.watch('quantity')) || 0;
  const projected = current + qty;
  const willCoverMin = projected >= min;

  const bumpQty = (delta: number) => {
    const next = Math.max(1, qty + delta);
    form.setValue('quantity', next, { shouldValidate: true });
  };

  const mutation = useMutation({
    mutationFn: async (values: RestockValues) => {
      const newStock = current + values.quantity;
      const { error: updErr } = await supabase
        .from('products')
        .update({
          current_stock: newStock,
          ...(values.brand?.trim() ? { brand: values.brand.trim() } : {}),
        })
        .eq('id', product.id);
      if (updErr) throw updErr;

      const { error: insErr } = await (supabase.from('product_purchases') as any).insert([{
        product_id: product.id,
        quantity: values.quantity,
        brand: values.brand?.trim() || null,
        warehouse_id: values.warehouse_id,
        notes: values.notes?.trim() || null,
        registered_by: (values.registered_by || currentUserName || '').trim() || null,
      }]);
      if (insErr) throw insErr;

      return { newStock, qty: values.quantity };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-epis'] });
      queryClient.invalidateQueries({ queryKey: ['products-tools'] });
      queryClient.invalidateQueries({ queryKey: ['product-purchases', product.id] });
      toast.success(`+${res.qty} adicionados. Estoque atual: ${res.newStock}`);
      onSuccess?.();
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col flex-1 min-h-0 min-w-0 w-full max-w-full"
      >
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-3 sm:px-5 pt-3 pb-4 space-y-4">
          {/* Resumo do produto */}
          <div className={cn(
            "p-3 sm:p-4 rounded-2xl border-2 flex items-center gap-3 min-w-0 max-w-full",
            accent === 'blue' ? "bg-blue-50/60 border-blue-100" : "bg-indigo-50/60 border-indigo-100"
          )}>
            <div className={cn(
              "p-3 rounded-xl shrink-0",
              accent === 'blue' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
            )}>
              <Box size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 text-sm leading-snug line-clamp-2 uppercase break-words">{product.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap min-w-0">
                {product.sku && (
                  <span className="text-[10px] font-mono font-bold text-slate-500 break-all">{product.sku}</span>
                )}
                {product.brand && (
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest break-words">
                    {product.brand}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cards atual / adicionar / ficará */}
          <div className="grid grid-cols-3 gap-2 min-w-0 max-w-full">
            <div className="bg-slate-50 rounded-2xl p-2 sm:p-3 text-center border border-slate-200 min-w-0 overflow-hidden">
              <p className="text-[10px] font-black uppercase text-slate-400 truncate">Atual</p>
              <p className="text-xl sm:text-2xl font-black text-slate-800 tabular-nums">{current}</p>
            </div>
            <div className={cn(
              "rounded-2xl p-2 sm:p-3 text-center border min-w-0 overflow-hidden",
              accent === 'blue' ? "bg-blue-50 border-blue-200" : "bg-indigo-50 border-indigo-200"
            )}>
              <p className={cn(
                "text-[10px] font-black uppercase truncate",
                accent === 'blue' ? "text-blue-700" : "text-indigo-700"
              )}>Adicionar</p>
              <p className={cn(
                "text-xl sm:text-2xl font-black tabular-nums",
                accent === 'blue' ? "text-blue-700" : "text-indigo-700"
              )}>+{qty}</p>
            </div>
            <div className={cn(
              "rounded-2xl p-2 sm:p-3 text-center border-2 min-w-0 overflow-hidden",
              willCoverMin
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            )}>
              <p className="text-[10px] font-black uppercase opacity-80 truncate">Ficará</p>
              <p className="text-xl sm:text-2xl font-black tabular-nums">{projected}</p>
            </div>
          </div>


          {min > 0 && !willCoverMin && (
            <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertCircle size={14} />
              Ainda abaixo do mínimo ({min}). Faltam {min - projected} para cobrir.
            </div>
          )}

          <FormField
            control={form.control}
            name="warehouse_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Almoxarifado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-2xl h-14 text-base bg-slate-50 border-slate-200">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-slate-400" />
                        <SelectValue placeholder="Selecione o local..." />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {warehouses?.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Quantidade a adicionar</FormLabel>
                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-2xl p-2">
                  <button
                    type="button"
                    onClick={() => bumpQty(-1)}
                    className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-700 active:scale-95 transition-transform shrink-0"
                    aria-label="Diminuir"
                  >−</button>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className="flex-1 h-12 border-none bg-transparent text-center text-3xl font-black text-slate-900 focus-visible:ring-0 p-0"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => bumpQty(1)}
                    className={cn(
                      "h-12 w-12 rounded-xl text-white flex items-center justify-center text-2xl font-black active:scale-95 transition-transform shrink-0 shadow-md",
                      accent === 'blue' ? "bg-blue-600" : "bg-indigo-600"
                    )}
                    aria-label="Aumentar"
                  >+</button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Marca desta compra (opcional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input className="pl-11 rounded-2xl h-14 bg-slate-50 border-slate-200 text-base" placeholder="Ex: 3M, VONDER..." {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {currentUserName && (
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 px-1">
              <User size={12} className="text-slate-400" />
              Responsável pela reposição: <span className="text-slate-800">{currentUserName}</span>
            </p>
          )}


          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Observação (opcional)</FormLabel>
                <FormControl>
                  <Textarea className="rounded-2xl bg-slate-50 border-slate-200 text-base min-h-[80px]" placeholder="Nota fiscal, fornecedor, lote..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="shrink-0 px-3 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white min-w-0">
          <Button
            type="submit"
            disabled={mutation.isPending || !warehouses?.length}
            className={cn(
              "w-full max-w-full min-w-0 h-14 rounded-2xl font-black text-base shadow-xl text-white whitespace-normal",
              accent === 'blue'
                ? "bg-blue-600 active:bg-blue-700 shadow-blue-300/50"
                : "bg-indigo-600 active:bg-indigo-700 shadow-indigo-300/50"
            )}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin shrink-0" /> Salvando...</>
            ) : (
              <><Plus className="mr-2 h-5 w-5 shrink-0" strokeWidth={3} /> <span className="truncate">Repor +{qty} no estoque</span></>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
