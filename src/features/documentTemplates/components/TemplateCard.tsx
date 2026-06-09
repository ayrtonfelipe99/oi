import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Download,
  Eye,
  FileSpreadsheet,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  Sparkles,
  Trash2,
} from "lucide-react";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";
import {
  getDownloadUrl,
  setTemplateActive,
  softDeleteTemplate,
} from "../services/templateService";
import {
  DOCUMENT_TEMPLATE_SOURCE_LABEL,
  DOCUMENT_TEMPLATE_TYPE_LABEL,
  type DocumentTemplate,
} from "../types/documentTemplateTypes";

interface Props {
  template: DocumentTemplate;
  onEditBuilder?: () => void;
}

export function TemplateCard({ template, onEditBuilder }: Props) {
  const qc = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);

  const isBuilder = template.source_type === "visual_builder";
  const canPreview = !isBuilder && (template.type === "epi" || template.type === "tool");

  const toggle = useMutation({
    mutationFn: () => setTemplateActive(template.id, !template.is_active),
    onSuccess: () => {
      toast.success(
        template.is_active ? "Modelo desativado." : "Modelo ativado.",
      );
      qc.invalidateQueries({ queryKey: ["document-templates"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao alterar status."),
  });

  const del = useMutation({
    mutationFn: () => softDeleteTemplate(template.id),
    onSuccess: () => {
      toast.success("Modelo excluído.");
      qc.invalidateQueries({ queryKey: ["document-templates"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir."),
  });

  const handleDownload = async () => {
    try {
      const url = await getDownloadUrl(template);
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar link.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-blue-200 transition-all min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-900 text-sm truncate">
              {template.name}
            </p>
            <p className="text-xs text-slate-500 font-medium truncate">
              {template.original_file_name}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggle.mutate()} className="font-bold">
              {template.is_active ? (
                <>
                  <PowerOff size={14} className="mr-2" /> Desativar
                </>
              ) : (
                <>
                  <Power size={14} className="mr-2" /> Ativar
                </>
              )}
            </DropdownMenuItem>
            {isBuilder ? (
              <DropdownMenuItem onClick={() => onEditBuilder?.()} className="font-bold">
                <Pencil size={14} className="mr-2" /> Editar no editor
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleDownload} className="font-bold">
                <Download size={14} className="mr-2" /> Baixar original
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="font-bold text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => {
                if (confirm("Excluir este modelo?")) del.mutate();
              }}
            >
              <Trash2 size={14} className="mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {template.description && (
        <p className="text-xs text-slate-600 font-medium line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-1">
        <Badge
          className={
            template.is_active
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 hover:bg-slate-100"
          }
        >
          {template.is_active ? "Ativo" : "Inativo"}
        </Badge>
        <Badge variant="outline" className="font-bold">
          v{template.version}
        </Badge>
        <Badge variant="outline" className="font-bold">
          {DOCUMENT_TEMPLATE_TYPE_LABEL[template.type]}
        </Badge>
        <Badge
          variant="outline"
          className={
            isBuilder
              ? "font-bold border-violet-200 text-violet-700 bg-violet-50"
              : "font-bold"
          }
        >
          {isBuilder && <Sparkles size={10} className="mr-1" />}
          {DOCUMENT_TEMPLATE_SOURCE_LABEL[template.source_type]}
        </Badge>
      </div>

      <div className="text-[11px] text-slate-400 font-medium mt-1">
        Cadastrado em {new Date(template.created_at).toLocaleDateString("pt-BR")}
      </div>

      {isBuilder && onEditBuilder && (
        <Button
          variant="outline"
          className="mt-2 w-full rounded-xl font-bold border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-700"
          onClick={onEditBuilder}
        >
          <Pencil size={16} className="mr-2" />
          Editar no editor
        </Button>
      )}

      {canPreview && (
        <Button
          variant="outline"
          className="mt-2 w-full rounded-xl font-bold border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye size={16} className="mr-2" />
          Ver como ficará no final
        </Button>
      )}

      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={template}
      />
    </div>
  );
}
