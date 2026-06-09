import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2, Plus, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { listTemplates } from "../services/templateService";
import { TemplateCard } from "../components/TemplateCard";
import { CreateTemplateDialog } from "../components/CreateTemplateDialog";
import { VisualBuilderEditor } from "../components/VisualBuilderEditor";
import {
  DOCUMENT_TEMPLATE_TYPE_LABEL,
  type DocumentTemplate,
  type DocumentTemplateType,
} from "../types/documentTemplateTypes";

const TABS: { value: DocumentTemplateType; label: string; icon: React.ReactNode }[] = [
  { value: "epi", label: "Modelo de EPI", icon: <ShieldCheck size={16} /> },
  { value: "tool", label: "Modelo de Ferramentas", icon: <Wrench size={16} /> },
  { value: "other", label: "Personalizados", icon: <FileSpreadsheet size={16} /> },
];

export function DocumentTemplatesPage() {
  const [active, setActive] = useState<DocumentTemplateType>("epi");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["document-templates"],
    queryFn: listTemplates,
  });

  const filtered = (data ?? []).filter((t) => t.type === active);
  const canUseBuilder = active === "epi" || active === "tool";

  const openEditor = (tpl?: DocumentTemplate) => {
    setEditingTemplate(tpl ?? null);
    setBuilderOpen(true);
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Modelos de Documentos
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Cadastre os modelos oficiais usados para gerar fichas de EPI e Ferramentas.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {canUseBuilder && (
            <Button
              variant="outline"
              className="rounded-xl font-bold w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => openEditor()}
            >
              <Sparkles size={16} className="mr-2" />
              Criar pelo sistema
            </Button>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold w-full sm:w-auto"
            onClick={() => setUploadOpen(true)}
          >
            <Plus size={16} className="mr-2" /> Enviar XLSX
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex bg-slate-50 border border-slate-200/60 p-1 h-auto rounded-2xl w-full max-w-xl overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setActive(t.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                active === t.value
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-500 hover:bg-white",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">
              Nenhum modelo de {DOCUMENT_TEMPLATE_TYPE_LABEL[active]} cadastrado.
            </p>
            <p className="text-sm text-slate-500 font-medium">
              Envie um XLSX{canUseBuilder ? " ou crie um modelo direto no sistema." : "."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} onEditBuilder={() => openEditor(t)} />
            ))}
          </div>
        )}
      </div>

      <CreateTemplateDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultType={active}
      />
      {canUseBuilder && (
        <VisualBuilderEditor
          open={builderOpen}
          onOpenChange={(o) => {
            setBuilderOpen(o);
            if (!o) setEditingTemplate(null);
          }}
          type={active}
          template={editingTemplate}
        />
      )}
    </div>
  );
}
