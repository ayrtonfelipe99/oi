import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type PaperSize = "A4" | "A3" | "Letter" | "Legal";
export type Orientation = "portrait" | "landscape";

export interface PageSetup {
  paperSize: PaperSize;
  orientation: Orientation;
  // margins in millimeters
  margins: { top: number; right: number; bottom: number; left: number };
  printArea: string; // e.g. "A1:H30"
  header: string;
  footer: string;
  fitToPage: boolean;
}

export const DEFAULT_PAGE_SETUP: PageSetup = {
  paperSize: "A4",
  orientation: "portrait",
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  printArea: "",
  header: "",
  footer: "",
  fitToPage: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: PageSetup;
  onChange: (next: PageSetup) => void;
}

export function PageSetupDialog({ open, onOpenChange, value, onChange }: Props) {
  const [draft, setDraft] = useState<PageSetup>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const update = <K extends keyof PageSetup>(k: K, v: PageSetup[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const updateMargin = (k: keyof PageSetup["margins"], v: number) =>
    setDraft((d) => ({ ...d, margins: { ...d.margins, [k]: v } }));

  const save = () => {
    onChange(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">
            Layout da página
          </DialogTitle>
          <DialogDescription>
            Estas configurações são aplicadas quando o modelo é exportado para Excel/PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Tamanho do papel</Label>
              <Select
                value={draft.paperSize}
                onValueChange={(v) => update("paperSize", v as PaperSize)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                  <SelectItem value="Letter">Carta (216 × 279 mm)</SelectItem>
                  <SelectItem value="Legal">Ofício (216 × 356 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Orientação</Label>
              <Select
                value={draft.orientation}
                onValueChange={(v) => update("orientation", v as Orientation)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Retrato</SelectItem>
                  <SelectItem value="landscape">Paisagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">Margens (mm)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(["top", "right", "bottom", "left"] as const).map((k) => (
                <div key={k} className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-500 font-bold">
                    {{ top: "Topo", right: "Direita", bottom: "Base", left: "Esquerda" }[k]}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={draft.margins[k]}
                    onChange={(e) => updateMargin(k, Number(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">
              Área de impressão <span className="font-medium text-slate-400">(opcional)</span>
            </Label>
            <Input
              placeholder="Ex: A1:H30 — deixe vazio para imprimir tudo"
              value={draft.printArea}
              onChange={(e) =>
                update("printArea", e.target.value.toUpperCase().replace(/\s+/g, ""))
              }
              className="h-9 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">
                Cabeçalho <span className="font-medium text-slate-400">(aparece no topo de cada página)</span>
              </Label>
              <Textarea
                rows={2}
                value={draft.header}
                onChange={(e) => update("header", e.target.value)}
                placeholder="Ex: ALMOX — Ficha Individual de EPI"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">
                Rodapé <span className="font-medium text-slate-400">(aparece no final de cada página)</span>
              </Label>
              <Textarea
                rows={2}
                value={draft.footer}
                onChange={(e) => update("footer", e.target.value)}
                placeholder="Ex: Página &P de &N"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.fitToPage}
              onChange={(e) => update("fitToPage", e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Ajustar conteúdo à largura da página
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={save}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
