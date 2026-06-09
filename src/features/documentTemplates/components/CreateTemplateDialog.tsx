import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import {
  createTemplate,
  validateXlsxFile,
} from "../services/templateService";
import {
  DOCUMENT_TEMPLATE_TYPE_LABEL,
  type DocumentTemplateType,
} from "../types/documentTemplateTypes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: DocumentTemplateType;
}

export function CreateTemplateDialog({ open, onOpenChange, defaultType }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentTemplateType>(defaultType ?? "epi");
  const [version, setVersion] = useState("1");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const reset = () => {
    setName("");
    setType(defaultType ?? "epi");
    setVersion("1");
    setDescription("");
    setFile(null);
  };

  const m = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Selecione um arquivo .xlsx.");
      if (!name.trim()) throw new Error("Informe o nome do modelo.");
      return createTemplate({
        name: name.trim(),
        type,
        version,
        description,
        file,
      });
    },
    onSuccess: () => {
      toast.success("Modelo cadastrado com sucesso!");
      qc.invalidateQueries({ queryKey: ["document-templates"] });
      reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao cadastrar modelo."),
  });

  const handleFile = async (f: File | null) => {
    if (!f) return setFile(null);
    try {
      await validateXlsxFile(f);
      setFile(f);
    } catch (e: any) {
      toast.error(e.message);
      setFile(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-[520px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">
            Novo Modelo de Documento
          </DialogTitle>
          <DialogDescription>
            Apenas arquivos <strong>.xlsx</strong> são aceitos nesta versão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome do modelo *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ficha Individual de EPIs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as DocumentTemplateType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["epi", "tool", "other"] as DocumentTemplateType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {DOCUMENT_TEMPLATE_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Versão</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Arquivo .xlsx *</Label>
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-all">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                {file ? <FileSpreadsheet size={20} /> : <Upload size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">
                  {file ? file.name : "Selecionar arquivo .xlsx"}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "Somente .xlsx. .xls não é aceito."}
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => m.mutate()}
            disabled={m.isPending || !file || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {m.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            Cadastrar Modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
