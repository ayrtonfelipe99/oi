import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Layers, Trash2, Pencil, Loader2, HardHat, Wrench } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  getIconComponent,
  getColorClasses,
} from "@/lib/categoryIcons";

type CategoryType = "epi" | "tool";

interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
}


const DEFAULT_CATEGORY_NAMES = new Set([
  "01. Proteção de Cabeça",
  "02. Proteção Visual e Facial",
  "03. Proteção Auditiva",
  "04. Proteção Respiratória",
  "05. Camisas",
  "06. Proteção de Tronco",
  "07. Membros Superiores",
  "08. Calças",
  "09. Botas",
  "10. Proteção Contra Queda",
  "11. Ferramentas Manuais",
  "12. Ferramentas Elétricas",
  "13. Equipamentos Diversos",
  "14. Acessórios P/ Ferramentas",
]);

const isDefaultCategory = (c: Category) => DEFAULT_CATEGORY_NAMES.has(c.name);


export function CategoriesManager() {
  const { isAdmin, isProgramador } = useAuth();
  const canManage = isAdmin || isProgramador;
  const qc = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("epi");
  const [icon, setIcon] = useState<string>("Package");
  const [color, setColor] = useState<string>("blue");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["dashboard-group-stats"] });
    qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
  };

  type Payload = { name: string; type: CategoryType; icon: string; color: string };

  const createMutation = useMutation({
    mutationFn: async (v: Payload) => {
      const { error } = await supabase.from("categories").insert([v as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria criada com sucesso!");
      invalidateAll();
      closeDialog();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (v: Payload & { id: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ name: v.name, type: v.type, icon: v.icon, color: v.color } as any)
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria atualizada!");
      invalidateAll();
      closeDialog();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida!");
      invalidateAll();
      setDeleteTarget(null);
    },
    onError: (e: any) =>
      toast.error(
        "Não foi possível excluir. Verifique se nenhum produto está usando esta categoria. (" +
          e.message +
          ")",
      ),
  });

  const closeDialog = () => {
    setIsOpen(false);
    setEditing(null);
    setName("");
    setType("epi");
    setIcon("Package");
    setColor("blue");
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("epi");
    setIcon("Package");
    setColor("blue");
    setIsOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setIcon(c.icon || "Package");
    setColor(c.color || "blue");
    setIsOpen(true);
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }
    const payload = { name: name.trim(), type, icon, color };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };


  const epis = (categories || []).filter((c) => c.type === "epi");
  const tools = (categories || []).filter((c) => c.type === "tool");

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Layers size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs uppercase tracking-[0.15em] font-black text-slate-500">
              Categorias
            </h2>
            <p className="text-lg sm:text-xl font-black text-slate-900">
              {categories?.length ?? 0} cadastradas
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Aparecem no dashboard, EPIs e Ferramentas automaticamente.
            </p>
          </div>
        </div>
        {canManage && (
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 h-11 rounded-xl shadow-md hover:shadow-lg font-bold w-full lg:w-auto"
          >
            <Plus size={16} className="mr-2" />
            Nova Categoria
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <CategoryColumn
            title="EPIs"
            icon={<HardHat size={18} />}
            color="blue"
            items={epis}
            canManage={canManage}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
          <CategoryColumn
            title="Ferramentas"
            icon={<Wrench size={18} />}
            color="indigo"
            items={tools}
            canManage={canManage}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(o) => (o ? setIsOpen(o) : closeDialog())}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {editing ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              Categorias aparecem nos cadastros de EPI/Ferramentas e no dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Nome *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: 15. Proteção Térmica"
                autoFocus
              />
              <p className="text-xs text-slate-500">
                Dica: comece com um número (ex.: "15.") para manter ordenação coerente
                com o dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Tipo *
              </label>
              <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epi">EPI</SelectItem>
                  <SelectItem value="tool">Ferramenta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Cor
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    title={c.label}
                    className={cn(
                      "w-8 h-8 rounded-xl border-2 transition flex items-center justify-center",
                      c.bg,
                      color === c.key ? "border-slate-900 scale-110" : "border-transparent",
                    )}
                  >
                    <span className={cn("w-3 h-3 rounded-full", c.text.replace("text-", "bg-"))} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Ícone
              </label>
              <div className="grid grid-cols-8 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                {CATEGORY_ICONS.map((iconKey) => {
                  const IconComp = getIconComponent(iconKey);
                  const colorCls = getColorClasses(color);
                  const selected = icon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setIcon(iconKey)}
                      title={iconKey}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center transition border-2",
                        selected
                          ? cn(colorCls.bg, colorCls.text, "border-slate-900")
                          : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100",
                      )}
                    >
                      <IconComp size={18} />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2 p-3 bg-slate-50 rounded-xl">
                <div className={cn("p-2 rounded-xl", getColorClasses(color).bg, getColorClasses(color).text)}>
                  {(() => {
                    const IconComp = getIconComponent(icon);
                    return <IconComp size={20} />;
                  })()}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">{name || "Pré-visualização"}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {type === "epi" ? "EPI" : "Ferramenta"}
                  </p>
                </div>
              </div>
            </div>
          </div>


          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 font-bold"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Excluir categoria?
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Categorias usadas por produtos não podem
              ser removidas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-slate-700 font-medium">
            {deleteTarget?.name}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryColumn({
  title,
  icon,
  color,
  items,
  canManage,
  onEdit,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  color: "blue" | "indigo";
  items: Category[];
  canManage: boolean;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <div className={cn("p-2 rounded-xl", colorMap[color])}>{icon}</div>
        <h3 className="font-black text-slate-900">{title}</h3>
        <Badge variant="secondary" className="ml-auto font-bold">
          {items.length}
        </Badge>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-center text-slate-400 font-medium">
            Nenhuma categoria.
          </p>
        ) : (
          items.map((c) => {
            const IconComp = getIconComponent(c.icon);
            const cc = getColorClasses(c.color);
            return (
            <div
              key={c.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition"
            >
              <div className={cn("p-1.5 rounded-lg shrink-0", cc.bg, cc.text)}>
                <IconComp size={16} />
              </div>
              <span className="text-sm font-bold text-slate-700 flex-1 truncate">
                {c.name}
              </span>

              {canManage && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                    onClick={() => onEdit(c)}
                  >
                    <Pencil size={14} />
                  </Button>
                  {!isDefaultCategory(c) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                  {isDefaultCategory(c) && (
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                      Padrão
                    </Badge>
                  )}

                </>
              )}
            </div>
            );
          })

        )}
      </div>
    </div>
  );
}
