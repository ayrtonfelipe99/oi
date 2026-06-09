import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Eye, FileSpreadsheet } from "lucide-react";
import { getDownloadUrl } from "../services/templateService";
import {
  DOCUMENT_TEMPLATE_TYPE_LABEL,
  type DocumentTemplate,
  type DocumentTemplateType,
} from "../types/documentTemplateTypes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate | null;
}

// ---------- Sanitization ----------
// Cleans any value before it is written into a spreadsheet cell.
// Strips HTML tags, id/class attributes, normalizes whitespace.
export function sanitizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      // never let [object Object] leak into a cell
      const s = JSON.stringify(value);
      return sanitizeCellValue(s);
    } catch {
      return "";
    }
  }
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/id\s*=\s*"[^"]*"/gi, "")
    .replace(/class\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Sample header data used to illustrate how the final document will look.
const SAMPLE_HEADER: Record<DocumentTemplateType, Record<string, string>> = {
  epi: {
    "{NOME COMPLETO}": "JOÃO DA SILVA SANTOS",
    "{Cargo / Função}": "Eletricista Industrial",
    "{Setor / Departamento}": "Manutenção Elétrica",
    "{MATRICULA}": "00123",
    "{Contrato Atual}": "CT-2026/045 - Obra Refinaria Norte",
    "{numero da orden, opcional}": "OS-173",
    "{Unidade}": "PÇ",
  },
  tool: {
    "{NOME COMPLETO}": "JOÃO DA SILVA SANTOS",
    "{Cargo / Função}": "Eletricista Industrial",
    "{Setor / Departamento}": "Manutenção Elétrica",
    "{MATRICULA}": "00123",
    "{Contrato Atual}": "CT-2026/045",
    "{numero da orden, opcional}": "OS-173",
    "{Unidade}": "PÇ",
  },
  other: {},
};

// Sample EPI rows (rows 7..21 on FS-0006). Columns map to A,B,D,E,F,H,K.
const SAMPLE_EPI_ROWS = [
  { unit: "PÇ", qty: 1, desc: "Capacete de segurança classe B aba frontal", ca: "31469" },
  { unit: "PAR", qty: 1, desc: "Luva isolante de borracha classe 2", ca: "29799" },
  { unit: "PAR", qty: 1, desc: "Botina de segurança bico de composite", ca: "42050" },
  { unit: "PÇ", qty: 1, desc: "Óculos de proteção incolor antiembaçante", ca: "9722" },
  { unit: "PÇ", qty: 1, desc: "Protetor auricular tipo plug com cordão", ca: "5745" },
];

// Replace {...} placeholders inside the raw cell values of the worksheet,
// BEFORE rendering to HTML. This guarantees SheetJS escapes everything.
function applyHeaderPlaceholders(
  ws: XLSX.WorkSheet,
  type: DocumentTemplateType,
): { unmapped: Set<string> } {
  const map = SAMPLE_HEADER[type];
  const unmapped = new Set<string>();
  const ref = ws["!ref"];
  if (!ref) return { unmapped };
  const range = XLSX.utils.decode_range(ref);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell || typeof cell.v !== "string") continue;
      let val: string = cell.v;
      if (!val.includes("{")) continue;
      // Replace known placeholders
      for (const [k, v] of Object.entries(map)) {
        if (val.includes(k)) {
          val = val.split(k).join(sanitizeCellValue(v));
        }
      }
      // Collect leftover placeholders (do NOT mutate them — render as-is so user sees gaps)
      const leftover = val.match(/\{[^{}]+\}/g);
      if (leftover) leftover.forEach((p) => unmapped.add(p));
      cell.v = sanitizeCellValue(val);
      cell.w = cell.v;
      if (cell.t !== "s") cell.t = "s";
      delete (cell as any).f; // drop any formula that could re-render the placeholder
      delete (cell as any).h;
      delete (cell as any).r;
    }
  }
  return { unmapped };
}

// Insert sample EPI rows into the items table by mutating worksheet cells.
// Items table on FS-0006 starts at row 7 (1-indexed) -> R=6 in 0-indexed.
function injectSampleEpiRows(ws: XLSX.WorkSheet) {
  const START_ROW = 6; // row 7 (1-indexed)
  const setCell = (r: number, c: number, value: string | number) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    const clean = sanitizeCellValue(value);
    ws[addr] = { t: typeof value === "number" ? "n" : "s", v: typeof value === "number" ? value : clean, w: clean };
  };
  SAMPLE_EPI_ROWS.forEach((item, i) => {
    const r = START_ROW + i;
    setCell(r, 0, item.unit); // A
    setCell(r, 1, item.qty);  // B (merged with C)
    setCell(r, 3, item.desc); // D
    setCell(r, 4, item.ca);   // E
    setCell(r, 5, "07/06/2026"); // F - data retirada
    setCell(r, 10, "07/06/2026"); // K - data treinamento
  });
}

export function TemplatePreviewDialog({ open, onOpenChange, template }: Props) {
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string>("");
  const [unmapped, setUnmapped] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !template) return;
    setLoading(true);
    setError(null);
    setHtml("");
    setUnmapped([]);
    (async () => {
      try {
        const url = await getDownloadUrl(template);
        const buf = await fetch(url).then((r) => r.arrayBuffer());
        const wb = XLSX.read(buf, { type: "array", cellHTML: false, cellFormula: false });
        const sheet =
          wb.SheetNames.find((n) => n.includes("(2)")) ?? wb.SheetNames[0];
        setSheetName(sheet);
        const ws = wb.Sheets[sheet];

        // 1) Mutate the worksheet itself — never touch HTML strings.
        const { unmapped: gaps } = applyHeaderPlaceholders(ws, template.type);
        if (template.type === "epi") injectSampleEpiRows(ws);
        setUnmapped(Array.from(gaps));

        // 2) Render to HTML AFTER mutation. SheetJS escapes values for us.
        const rendered = XLSX.utils.sheet_to_html(ws, { editable: false });
        setHtml(rendered);
      } catch (e: any) {
        setError(e.message ?? "Erro ao carregar pré-visualização.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, template]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1100px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] p-0 gap-0 overflow-hidden rounded-3xl">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Eye size={18} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-black text-slate-900 truncate">
                Pré-visualização — {template?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                {template
                  ? `${DOCUMENT_TEMPLATE_TYPE_LABEL[template.type]} · Aba: ${sheetName || "—"} · Aproximação visual — o XLSX final é a fonte oficial`
                  : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-auto bg-slate-50 p-4 sm:p-6" style={{ maxHeight: "calc(100dvh - 160px)" }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="animate-spin" />
              <p className="text-sm font-bold">Renderizando modelo…</p>
            </div>
          )}
          {error && (
            <div className="text-center py-16 text-red-600 font-bold">
              <FileSpreadsheet className="mx-auto mb-3" />
              {error}
            </div>
          )}
          {!loading && !error && html && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-auto p-4">
              <style>{`
                .xlsx-preview table { border-collapse: collapse; width: 100%; font-size: 12px; font-family: Arial, sans-serif; table-layout: auto; }
                .xlsx-preview td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; min-width: 40px; word-break: break-word; }
                .xlsx-preview tr:first-child td { background: #f1f5f9; font-weight: 800; text-align: center; font-size: 13px; }
              `}</style>
              {/* SheetJS escapes cell content; safe to inject. */}
              <div
                className="xlsx-preview"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}
          {unmapped.length > 0 && (
            <div className="mt-3 text-[11px] text-amber-700 font-bold px-1">
              Placeholders não mapeados nesta pré-visualização: {unmapped.join(", ")}
            </div>
          )}
          <div className="mt-2 text-[11px] text-slate-500 font-medium px-1">
            Esta é apenas uma aproximação visual. O arquivo XLSX gerado preserva o layout original (mesclagens, bordas, fontes, impressão).
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
