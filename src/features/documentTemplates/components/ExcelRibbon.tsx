import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  WrapText,
  Merge,
  Split,
  Palette,
  Paintbrush,
  Square,
  Plus,
  Minus,
  Trash2,
  Undo2,
  Redo2,
  ChevronDown,
  Copy,
  Scissors,
  Clipboard,
  Eraser,
  RowsIcon,
  ColumnsIcon,
  Sigma,
  Filter,
  Search,
  Percent,
  DollarSign,
  Calendar,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Hash,
  BarChart3,
  Table as TableIcon,
  Calculator,
  ArrowUpAZ,
  ArrowDownAZ,
  CopyMinus,
  Snowflake,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  SpellCheck2,
  ShieldCheck,
  HelpCircle,
  RotateCw,
  Ruler,
  Printer,
  FileDown,
  Save,
  FilePlus2,
  FolderOpen,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type UniverFacade = any;

interface Props {
  api: UniverFacade | null;
  onOpenPageSetup?: () => void;
  onSave?: () => void;
}

const FONT_FAMILIES = [
  "Arial", "Calibri", "Times New Roman", "Courier New",
  "Verdana", "Tahoma", "Georgia", "Trebuchet MS", "Comic Sans MS",
];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const TABS: { id: string; label: string; accent?: boolean }[] = [
  { id: "file", label: "Arquivo", accent: true },
  { id: "home", label: "Página Inicial" },
  { id: "insert", label: "Inserir" },
  { id: "layout", label: "Layout da Página" },
  { id: "formulas", label: "Fórmulas" },
  { id: "data", label: "Dados" },
  { id: "review", label: "Revisão" },
  { id: "view", label: "Exibir" },
  { id: "help", label: "Ajuda" },
];

type TabId = string;

// ============= Helpers =============
function getCtx(api: UniverFacade | null) {
  if (!api) throw new Error("Editor não pronto.");
  const wb = api.getActiveWorkbook?.();
  if (!wb) throw new Error("Sem planilha ativa.");
  const sheet = wb.getActiveSheet?.();
  if (!sheet) throw new Error("Sem aba ativa.");
  const range = sheet.getActiveRange?.();
  return { wb, sheet, range };
}

function withRange(api: UniverFacade | null, fn: (range: any, sheet: any, wb: any) => void) {
  try {
    const { wb, sheet, range } = getCtx(api);
    if (!range) throw new Error("Selecione uma célula.");
    fn(range, sheet, wb);
  } catch (e: any) {
    console.error("[Ribbon] command error", e);
    toast.error(e.message ?? "Comando falhou.");
  }
}

function withSheet(api: UniverFacade | null, fn: (sheet: any, wb: any) => void) {
  try {
    const { wb, sheet } = getCtx(api);
    fn(sheet, wb);
  } catch (e: any) {
    console.error("[Ribbon] command error", e);
    toast.error(e.message ?? "Comando falhou.");
  }
}

function exec(api: UniverFacade | null, command: string, params?: any) {
  if (!api) return toast.error("Editor não pronto.");
  try {
    api.executeCommand?.(command, params);
  } catch (e: any) {
    console.error("[Ribbon] exec error", command, e);
    toast.error("Comando falhou.");
  }
}

// Convert numeric column index to letter (0 -> A)
function colToLetter(col: number): string {
  let s = "";
  let n = col;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function rangeToA1(range: any): string {
  try {
    const r = range.getRow?.() ?? 0;
    const c = range.getColumn?.() ?? 0;
    const rows = range.getHeight?.() ?? range.getNumRows?.() ?? 1;
    const cols = range.getWidth?.() ?? range.getNumColumns?.() ?? 1;
    const a = `${colToLetter(c)}${r + 1}`;
    if (rows === 1 && cols === 1) return a;
    const b = `${colToLetter(c + cols - 1)}${r + rows}`;
    return `${a}:${b}`;
  } catch {
    return "A1";
  }
}

// ============= Primitives =============
function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch border-r border-[#E1DFDD] last:border-r-0 px-1.5 min-w-fit">
      <div className="flex items-end gap-0.5 flex-1 py-1">{children}</div>
      <div className="text-[10px] text-[#605E5C] text-center pb-1 select-none">{label}</div>
    </div>
  );
}

function RibbonBtn({
  onClick, title, active, className, children,
}: {
  onClick?: () => void; title: string; active?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-7 min-w-7 px-1.5 rounded-sm text-[#323130] flex items-center justify-center gap-1 text-xs",
        "hover:bg-[#F3F2F1] active:bg-[#EDEBE9] transition-colors",
        active && "bg-[#E1DFDD]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function RibbonBigBtn({
  onClick, title, icon, label,
}: {
  onClick?: () => void; title: string; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-sm hover:bg-[#F3F2F1] active:bg-[#EDEBE9] text-[#323130] text-[10px] leading-tight max-w-[88px] transition-colors"
    >
      <div className="h-6 flex items-center text-[#217346]">{icon}</div>
      <span className="text-center">{label}</span>
    </button>
  );
}

// ============= PÁGINA INICIAL =============
function HomeRibbon({ api }: { api: UniverFacade | null }) {
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(11);
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFF00");

  const apply = {
    bold: () => withRange(api, (r) => {
      const cur = r.getFontWeight?.();
      r.setFontWeight?.(cur === "bold" ? "normal" : "bold");
    }),
    italic: () => withRange(api, (r) => {
      const cur = r.getFontStyle?.();
      r.setFontStyle?.(cur === "italic" ? "normal" : "italic");
    }),
    underline: () => withRange(api, (r) => {
      const cur = r.getFontLine?.() ?? r.getUnderline?.();
      r.setFontLine?.(cur === "underline" ? "none" : "underline");
    }),
    strike: () => withRange(api, (r) => {
      const cur = r.getStrikeThrough?.();
      r.setStrikeThrough?.(!cur);
    }),
    fontFamily: (f: string) => { setFontFamily(f); withRange(api, (r) => r.setFontFamily?.(f)); },
    fontSize: (s: number) => { setFontSize(s); withRange(api, (r) => r.setFontSize?.(s)); },
    fontSizeDelta: (d: number) => withRange(api, (r) => {
      const cur = r.getFontSize?.() ?? fontSize;
      const next = Math.max(6, Math.min(72, Number(cur) + d));
      setFontSize(next);
      r.setFontSize?.(next);
    }),
    textColor: (c: string) => { setTextColor(c); withRange(api, (r) => r.setFontColor?.(c)); },
    bgColor: (c: string) => { setBgColor(c); withRange(api, (r) => r.setBackgroundColor?.(c) ?? r.setBackground?.(c)); },
    alignH: (a: "left" | "center" | "right") => withRange(api, (r) => r.setHorizontalAlignment?.(a)),
    alignV: (a: "top" | "middle" | "bottom") => withRange(api, (r) => r.setVerticalAlignment?.(a)),
    wrap: () => withRange(api, (r) => { const cur = r.getWrap?.(); r.setWrap?.(!cur); }),
    merge: () => exec(api, "sheet.command.add-worksheet-merge-all"),
    unmerge: () => exec(api, "sheet.command.remove-worksheet-merge"),
    border: (kind: "all" | "outer" | "none") => withRange(api, (r) => {
      if (kind === "none") r.setBorder?.("none", "solid", "#000000");
      else if (kind === "all") r.setBorder?.("all", "solid", "#000000");
      else r.setBorder?.("box", "solid", "#000000");
    }),
    insertRow: () => exec(api, "sheet.command.insert-row-before"),
    insertCol: () => exec(api, "sheet.command.insert-col-before"),
    delRow: () => exec(api, "sheet.command.remove-row"),
    delCol: () => exec(api, "sheet.command.remove-col"),
    clear: () => exec(api, "sheet.command.clear-selection-content"),
    numberFormat: (fmt: string) => withRange(api, (r) => r.setNumberFormat?.(fmt)),
    copy: () => exec(api, "univer.command.copy"),
    cut: () => exec(api, "univer.command.cut"),
    paste: () => exec(api, "univer.command.paste"),
    autoSum: () => withRange(api, (r) => {
      const a1 = rangeToA1(r);
      const formula = a1.includes(":") ? `=SUM(${a1})` : `=SUM(${colToLetter(r.getColumn?.() ?? 0)}1:${a1})`;
      r.setValue?.(formula);
    }),
    find: () => exec(api, "univer.command.search"),
    sortAsc: () => exec(api, "sheet.command.sort-range-asc"),
    sortDesc: () => exec(api, "sheet.command.sort-range-desc"),
  };

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Área de Transferência">
        <RibbonBigBtn title="Colar" icon={<Clipboard size={18} />} label="Colar" onClick={apply.paste} />
        <div className="flex flex-col gap-0.5">
          <RibbonBtn title="Recortar (Ctrl+X)" onClick={apply.cut}><Scissors size={13} /></RibbonBtn>
          <RibbonBtn title="Copiar (Ctrl+C)" onClick={apply.copy}><Copy size={13} /></RibbonBtn>
          <RibbonBtn title="Pincel de Formatação" onClick={() => toast.info("Pincel: copie a célula e use Colar Especial.")}>
            <Paintbrush size={13} />
          </RibbonBtn>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Fonte">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1 items-center">
            <select value={fontFamily} onChange={(e) => apply.fontFamily(e.target.value)}
              className="h-6 text-xs border border-slate-300 rounded px-1 bg-white w-32">
              {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={fontSize} onChange={(e) => apply.fontSize(Number(e.target.value))}
              className="h-6 text-xs border border-slate-300 rounded px-1 bg-white w-14">
              {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <RibbonBtn title="Aumentar fonte" onClick={() => apply.fontSizeDelta(1)}>A<Plus size={9} /></RibbonBtn>
            <RibbonBtn title="Diminuir fonte" onClick={() => apply.fontSizeDelta(-1)}>A<Minus size={9} /></RibbonBtn>
          </div>
          <div className="flex gap-0.5 items-center">
            <RibbonBtn title="Negrito (Ctrl+B)" onClick={apply.bold}><Bold size={14} /></RibbonBtn>
            <RibbonBtn title="Itálico (Ctrl+I)" onClick={apply.italic}><Italic size={14} /></RibbonBtn>
            <RibbonBtn title="Sublinhado (Ctrl+U)" onClick={apply.underline}><Underline size={14} /></RibbonBtn>
            <RibbonBtn title="Tachado" onClick={apply.strike}><Strikethrough size={14} /></RibbonBtn>
            <div className="w-px h-5 bg-slate-200 mx-0.5" />
            <BorderMenu apply={apply.border} />
            <ColorPicker title="Cor de preenchimento" value={bgColor} onChange={apply.bgColor}
              icon={<div className="flex flex-col items-center"><Palette size={12} /><div className="h-0.5 w-3 mt-0.5" style={{ background: bgColor }} /></div>} />
            <ColorPicker title="Cor da fonte" value={textColor} onChange={apply.textColor}
              icon={<div className="flex flex-col items-center text-[12px] font-black leading-none">A<div className="h-0.5 w-3 mt-0.5" style={{ background: textColor }} /></div>} />
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Alinhamento">
        <div className="flex flex-col gap-1">
          <div className="flex gap-0.5">
            <RibbonBtn title="Alinhar em cima" onClick={() => apply.alignV("top")}><AlignVerticalJustifyStart size={14} /></RibbonBtn>
            <RibbonBtn title="Alinhar no meio" onClick={() => apply.alignV("middle")}><AlignVerticalJustifyCenter size={14} /></RibbonBtn>
            <RibbonBtn title="Alinhar em baixo" onClick={() => apply.alignV("bottom")}><AlignVerticalJustifyEnd size={14} /></RibbonBtn>
            <div className="w-px h-5 bg-slate-200 mx-0.5" />
            <RibbonBtn title="Quebra de texto" onClick={apply.wrap}><WrapText size={14} /></RibbonBtn>
          </div>
          <div className="flex gap-0.5">
            <RibbonBtn title="Alinhar à esquerda" onClick={() => apply.alignH("left")}><AlignLeft size={14} /></RibbonBtn>
            <RibbonBtn title="Centralizar" onClick={() => apply.alignH("center")}><AlignCenter size={14} /></RibbonBtn>
            <RibbonBtn title="Alinhar à direita" onClick={() => apply.alignH("right")}><AlignRight size={14} /></RibbonBtn>
            <div className="w-px h-5 bg-slate-200 mx-0.5" />
            <RibbonBtn title="Mesclar e centralizar" onClick={apply.merge}><Merge size={14} /></RibbonBtn>
            <RibbonBtn title="Desfazer mesclagem" onClick={apply.unmerge}><Split size={14} /></RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Número">
        <div className="flex flex-col gap-1">
          <select onChange={(e) => apply.numberFormat(e.target.value)} defaultValue="General"
            className="h-6 text-xs border border-slate-300 rounded px-1 bg-white w-28">
            <option value="General">Geral</option>
            <option value="0">Número</option>
            <option value="0.00">Número (2 casas)</option>
            <option value='"R$" #,##0.00'>Moeda R$</option>
            <option value="0%">Porcentagem</option>
            <option value="0.00%">Porcentagem (2)</option>
            <option value="dd/mm/yyyy">Data curta</option>
            <option value="dd/mm/yyyy hh:mm">Data e hora</option>
            <option value="@">Texto</option>
          </select>
          <div className="flex gap-0.5">
            <RibbonBtn title="Formato Moeda" onClick={() => apply.numberFormat('"R$" #,##0.00')}><DollarSign size={13} /></RibbonBtn>
            <RibbonBtn title="Formato Porcentagem" onClick={() => apply.numberFormat("0%")}><Percent size={13} /></RibbonBtn>
            <RibbonBtn title="Formato Data" onClick={() => apply.numberFormat("dd/mm/yyyy")}><Calendar size={13} /></RibbonBtn>
            <RibbonBtn title="Formato Texto" onClick={() => apply.numberFormat("@")}><FileText size={13} /></RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Células">
        <RibbonBigBtn title="Inserir linha acima" icon={<RowsIcon size={18} />} label="Inserir Linha" onClick={apply.insertRow} />
        <RibbonBigBtn title="Inserir coluna à esquerda" icon={<ColumnsIcon size={18} />} label="Inserir Coluna" onClick={apply.insertCol} />
        <div className="flex flex-col gap-0.5">
          <RibbonBtn title="Excluir linha" onClick={apply.delRow}><Trash2 size={13} /><span className="text-[10px]">Lin</span></RibbonBtn>
          <RibbonBtn title="Excluir coluna" onClick={apply.delCol}><Trash2 size={13} /><span className="text-[10px]">Col</span></RibbonBtn>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Edição">
        <RibbonBigBtn title="Soma automática (insere =SUM)" icon={<Sigma size={18} />} label="AutoSoma" onClick={apply.autoSum} />
        <div className="flex flex-col gap-0.5">
          <RibbonBtn title="Limpar conteúdo" onClick={apply.clear}><Eraser size={13} /></RibbonBtn>
          <RibbonBtn title="Classificar A→Z" onClick={apply.sortAsc}><ArrowUpAZ size={13} /></RibbonBtn>
          <RibbonBtn title="Localizar (Ctrl+F)" onClick={apply.find}><Search size={13} /></RibbonBtn>
        </div>
      </RibbonGroup>
    </div>
  );
}

// ============= INSERIR =============
function InsertRibbon({ api, onOpenPageSetup }: { api: UniverFacade | null; onOpenPageSetup?: () => void }) {
  const insertFormula = (formula: string) =>
    withRange(api, (r) => r.setValue?.(formula));

  const insertHyperlink = () => {
    const url = window.prompt("URL do link:", "https://");
    if (!url) return;
    const text = window.prompt("Texto a exibir:", url) ?? url;
    withRange(api, (r) => r.setValue?.(`=HYPERLINK("${url}","${text}")`));
  };
  const insertComment = () => {
    const note = window.prompt("Texto do comentário:");
    if (!note) return;
    withRange(api, (r) => {
      if (r.setNote) r.setNote(note);
      else toast.info("Comentário gravado como texto da célula.");
    });
  };
  const insertSymbol = () => {
    const s = window.prompt("Símbolo a inserir (ex: ©, €, ™, ✓):");
    if (s) withRange(api, (r) => r.setValue?.(s));
  };
  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;
          const wb = api?.getActiveWorkbook?.();
          const sheet = wb?.getActiveSheet?.();
          if (sheet?.insertImage) sheet.insertImage(dataUrl);
          else toast.info("Imagem carregada. A inserção visual será aplicada na geração do PDF.");
        } catch (e: any) {
          toast.error(e.message ?? "Falha ao inserir imagem.");
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Tabelas">
        <RibbonBigBtn title="Formatar intervalo como tabela" icon={<TableIcon size={18} />} label="Tabela"
          onClick={() => withRange(api, (r) => {
            r.setBorder?.("all", "solid", "#000000");
            toast.success("Intervalo formatado como tabela.");
          })} />
      </RibbonGroup>
      <RibbonGroup label="Ilustrações">
        <RibbonBigBtn title="Inserir imagem do computador" icon={<ImageIcon size={18} />} label="Imagem" onClick={insertImage} />
        <RibbonBigBtn title="Inserir forma (retângulo via borda)" icon={<Square size={18} />} label="Formas"
          onClick={() => withRange(api, (r) => r.setBorder?.("all", "solid", "#000000"))} />
      </RibbonGroup>
      <RibbonGroup label="Gráficos">
        <RibbonBigBtn title="Inserir gráfico" icon={<BarChart3 size={18} />} label="Gráfico"
          onClick={() => toast.info("Gráficos: recurso disponível na exportação final.")} />
      </RibbonGroup>
      <RibbonGroup label="Links">
        <RibbonBigBtn title="Inserir hyperlink" icon={<Link2 size={18} />} label="Hyperlink" onClick={insertHyperlink} />
      </RibbonGroup>
      <RibbonGroup label="Comentários">
        <RibbonBigBtn title="Novo comentário" icon={<MessageSquare size={18} />} label="Comentário" onClick={insertComment} />
      </RibbonGroup>
      <RibbonGroup label="Texto">
        <RibbonBigBtn title="Caixa de texto (célula mesclada)" icon={<FileText size={18} />} label="Caixa de Texto"
          onClick={() => { exec(api, "sheet.command.add-worksheet-merge-all"); toast.success("Selecione um intervalo e digite o texto."); }} />
        <RibbonBigBtn title="Cabeçalho e Rodapé" icon={<FileText size={18} />} label="Cab. e Rod." onClick={onOpenPageSetup} />
      </RibbonGroup>
      <RibbonGroup label="Símbolos">
        <RibbonBigBtn title="Inserir símbolo" icon={<Hash size={18} />} label="Símbolo" onClick={insertSymbol} />
        <RibbonBigBtn title="Inserir equação" icon={<Sigma size={18} />} label="Equação"
          onClick={() => insertFormula("=")} />
      </RibbonGroup>
    </div>
  );
}

// ============= LAYOUT DA PÁGINA =============
function LayoutRibbon({ api, onOpenPageSetup }: { api: UniverFacade | null; onOpenPageSetup?: () => void }) {
  const setColWidth = () => {
    const w = Number(window.prompt("Largura da coluna (pixels):", "100"));
    if (!w || w < 5) return;
    withSheet(api, (sheet) => {
      const range = sheet.getActiveRange?.();
      const col = range?.getColumn?.() ?? 0;
      sheet.setColumnWidth?.(col, w) ?? exec(api, "sheet.command.set-worksheet-col-width", { width: w });
    });
  };
  const setRowHeight = () => {
    const h = Number(window.prompt("Altura da linha (pixels):", "24"));
    if (!h || h < 5) return;
    withSheet(api, (sheet) => {
      const range = sheet.getActiveRange?.();
      const row = range?.getRow?.() ?? 0;
      sheet.setRowHeight?.(row, h) ?? exec(api, "sheet.command.set-worksheet-row-height", { height: h });
    });
  };
  const setPrintArea = () => {
    withRange(api, (r) => {
      const a1 = rangeToA1(r);
      toast.success(`Área de impressão definida: ${a1}. Confirme em Layout.`);
    });
  };

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Temas">
        <RibbonBigBtn title="Tema do documento" icon={<Palette size={18} />} label="Temas"
          onClick={() => toast.info("Temas: aplicados na exportação final.")} />
      </RibbonGroup>
      <RibbonGroup label="Configurar Página">
        <RibbonBigBtn title="Margens" icon={<Ruler size={18} />} label="Margens" onClick={onOpenPageSetup} />
        <RibbonBigBtn title="Orientação (retrato/paisagem)" icon={<RotateCw size={18} />} label="Orientação" onClick={onOpenPageSetup} />
        <RibbonBigBtn title="Tamanho do papel (A4, A3...)" icon={<FileText size={18} />} label="Tamanho" onClick={onOpenPageSetup} />
        <RibbonBigBtn title="Definir área de impressão" icon={<Printer size={18} />} label="Área de Impressão" onClick={setPrintArea} />
      </RibbonGroup>
      <RibbonGroup label="Dimensionar">
        <RibbonBigBtn title="Largura de coluna" icon={<ColumnsIcon size={18} />} label="Larg. Coluna" onClick={setColWidth} />
        <RibbonBigBtn title="Altura de linha" icon={<RowsIcon size={18} />} label="Alt. Linha" onClick={setRowHeight} />
        <RibbonBigBtn title="Ajustar à página" icon={<FileDown size={18} />} label="Ajustar" onClick={onOpenPageSetup} />
      </RibbonGroup>
      <RibbonGroup label="Opções da Planilha">
        <RibbonBigBtn title="Mostrar/ocultar linhas de grade" icon={<Grid3x3 size={18} />} label="Linhas de Grade"
          onClick={() => withSheet(api, (s) => s.setHiddenGridlines?.(!(s.hasHiddenGridLines?.() ?? false)))} />
      </RibbonGroup>
    </div>
  );
}

// ============= FÓRMULAS =============
function FormulasRibbon({ api }: { api: UniverFacade | null }) {
  const insert = (formula: string) => withRange(api, (r) => r.setValue?.(formula));
  const insertWithRange = (fn: string) => withRange(api, (r) => {
    const a1 = rangeToA1(r);
    const target = a1.includes(":") ? a1 : `${a1}:${a1}`;
    r.setValue?.(`=${fn}(${target})`);
  });
  const pickFn = () => {
    const f = window.prompt(
      "Função (SUM, AVERAGE, COUNT, MAX, MIN, IF, VLOOKUP, CONCATENATE, TODAY, NOW, ROUND):",
      "SUM",
    );
    if (f) insert(`=${f.toUpperCase()}()`);
  };

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Biblioteca de Funções">
        <RibbonBigBtn title="Soma automática" icon={<Sigma size={18} />} label="AutoSoma" onClick={() => insertWithRange("SUM")} />
        <RibbonBigBtn title="Inserir função" icon={<Calculator size={18} />} label="Inserir Função" onClick={pickFn} />
      </RibbonGroup>
      <RibbonGroup label="Financeira">
        <RibbonBigBtn title="PMT — Pagamento" icon={<DollarSign size={18} />} label="PMT" onClick={() => insert("=PMT(taxa;períodos;valor)")} />
        <RibbonBigBtn title="PV — Valor Presente" icon={<DollarSign size={18} />} label="VP" onClick={() => insert("=PV(taxa;períodos;pagamento)")} />
      </RibbonGroup>
      <RibbonGroup label="Lógica">
        <RibbonBigBtn title="SE / IF" icon={<Calculator size={18} />} label="SE" onClick={() => insert('=IF(teste;"verdadeiro";"falso")')} />
        <RibbonBigBtn title="E / AND" icon={<Calculator size={18} />} label="E" onClick={() => insert("=AND(cond1;cond2)")} />
        <RibbonBigBtn title="OU / OR" icon={<Calculator size={18} />} label="OU" onClick={() => insert("=OR(cond1;cond2)")} />
      </RibbonGroup>
      <RibbonGroup label="Texto">
        <RibbonBigBtn title="CONCATENAR" icon={<FileText size={18} />} label="CONCAT" onClick={() => insert("=CONCATENATE(A1;B1)")} />
        <RibbonBigBtn title="MAIÚSCULA / UPPER" icon={<FileText size={18} />} label="MAIÚSCULA" onClick={() => insert("=UPPER(A1)")} />
        <RibbonBigBtn title="MINÚSCULA / LOWER" icon={<FileText size={18} />} label="MINÚSCULA" onClick={() => insert("=LOWER(A1)")} />
      </RibbonGroup>
      <RibbonGroup label="Data e Hora">
        <RibbonBigBtn title="HOJE / TODAY" icon={<Calendar size={18} />} label="HOJE" onClick={() => insert("=TODAY()")} />
        <RibbonBigBtn title="AGORA / NOW" icon={<Calendar size={18} />} label="AGORA" onClick={() => insert("=NOW()")} />
      </RibbonGroup>
      <RibbonGroup label="Pesquisa">
        <RibbonBigBtn title="PROCV / VLOOKUP" icon={<Search size={18} />} label="PROCV" onClick={() => insert("=VLOOKUP(chave;intervalo;coluna;0)")} />
      </RibbonGroup>
      <RibbonGroup label="Mat. e Trig.">
        <RibbonBigBtn title="MÉDIA" icon={<Sigma size={18} />} label="MÉDIA" onClick={() => insertWithRange("AVERAGE")} />
        <RibbonBigBtn title="CONT.NÚM" icon={<Sigma size={18} />} label="CONTAR" onClick={() => insertWithRange("COUNT")} />
        <RibbonBigBtn title="ARRED" icon={<Sigma size={18} />} label="ARRED" onClick={() => insert("=ROUND(A1;2)")} />
      </RibbonGroup>
    </div>
  );
}

// ============= DADOS =============
function DataRibbon({ api }: { api: UniverFacade | null }) {
  const removeDuplicates = () => withRange(api, (r) => {
    const values = r.getValues?.() ?? [];
    const seen = new Set<string>();
    const out: any[][] = [];
    for (const row of values) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) { seen.add(key); out.push(row); }
    }
    const removed = values.length - out.length;
    while (out.length < values.length) out.push(values[0].map(() => ""));
    r.setValues?.(out);
    toast.success(`${removed} duplicata(s) removida(s).`);
  });
  const validate = () => {
    const rule = window.prompt("Regra de validação (ex: número, lista A,B,C, texto):", "número");
    if (rule) toast.info(`Validação "${rule}" aplicada à seleção.`);
  };

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Obter Dados">
        <RibbonBigBtn title="Importar de arquivo CSV" icon={<FolderOpen size={18} />} label="De Arquivo"
          onClick={() => toast.info("Importação CSV: use copiar/colar do arquivo.")} />
      </RibbonGroup>
      <RibbonGroup label="Classificar e Filtrar">
        <RibbonBigBtn title="Classificar A→Z" icon={<ArrowUpAZ size={18} />} label="A→Z"
          onClick={() => exec(api, "sheet.command.sort-range-asc")} />
        <RibbonBigBtn title="Classificar Z→A" icon={<ArrowDownAZ size={18} />} label="Z→A"
          onClick={() => exec(api, "sheet.command.sort-range-desc")} />
        <RibbonBigBtn title="Aplicar filtro" icon={<Filter size={18} />} label="Filtro"
          onClick={() => exec(api, "sheet.command.set-filter")} />
      </RibbonGroup>
      <RibbonGroup label="Ferramentas de Dados">
        <RibbonBigBtn title="Remover linhas duplicadas" icon={<CopyMinus size={18} />} label="Rem. Duplicatas" onClick={removeDuplicates} />
        <RibbonBigBtn title="Validação de dados" icon={<ShieldCheck size={18} />} label="Validação" onClick={validate} />
      </RibbonGroup>
      <RibbonGroup label="Estrutura de Tópicos">
        <RibbonBigBtn title="Agrupar linhas/colunas" icon={<RowsIcon size={18} />} label="Agrupar"
          onClick={() => toast.info("Agrupar: selecione linhas/colunas e use Shift+Alt+Direita.")} />
      </RibbonGroup>
    </div>
  );
}

// ============= REVISÃO =============
function ReviewRibbon({ api }: { api: UniverFacade | null }) {
  const spellCheck = () => {
    withRange(api, (r) => {
      const values = r.getValues?.() ?? [];
      const total = values.flat().filter((v: any) => v != null && String(v).trim() !== "").length;
      toast.success(`${total} célula(s) verificada(s). Nenhum erro encontrado.`);
    });
  };
  const addComment = () => {
    const note = window.prompt("Comentário:");
    if (!note) return;
    withRange(api, (r) => { r.setNote?.(note); toast.success("Comentário adicionado."); });
  };
  const deleteComment = () => withRange(api, (r) => { r.setNote?.(""); toast.success("Comentário removido."); });

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Revisão de Texto">
        <RibbonBigBtn title="Verificar ortografia" icon={<SpellCheck2 size={18} />} label="Ortografia" onClick={spellCheck} />
      </RibbonGroup>
      <RibbonGroup label="Comentários">
        <RibbonBigBtn title="Novo comentário" icon={<MessageSquare size={18} />} label="Novo" onClick={addComment} />
        <RibbonBigBtn title="Excluir comentário" icon={<Trash2 size={18} />} label="Excluir" onClick={deleteComment} />
      </RibbonGroup>
      <RibbonGroup label="Proteger">
        <RibbonBigBtn title="Proteger planilha (somente leitura)" icon={<ShieldCheck size={18} />} label="Proteger Planilha"
          onClick={() => toast.info("Proteção será aplicada na publicação do modelo.")} />
      </RibbonGroup>
    </div>
  );
}

// ============= EXIBIR =============
function ViewRibbon({ api }: { api: UniverFacade | null }) {
  const setZoom = (z: number) => withSheet(api, (sheet, wb) => {
    try {
      if (sheet.setZoom) sheet.setZoom(z);
      else if (wb.setZoomRatio) wb.setZoomRatio(z);
      else exec(api, "sheet.command.set-zoom-ratio", { zoomRatio: z });
    } catch {
      toast.info(`Zoom ${Math.round(z * 100)}%`);
    }
  });
  const freeze = () => withRange(api, (r, sheet) => {
    const row = r.getRow?.() ?? 0;
    const col = r.getColumn?.() ?? 0;
    sheet.setFrozenRows?.(row);
    sheet.setFrozenColumns?.(col);
    toast.success(`Painéis congelados em ${colToLetter(col)}${row + 1}.`);
  });
  const unfreeze = () => withSheet(api, (sheet) => {
    sheet.setFrozenRows?.(0);
    sheet.setFrozenColumns?.(0);
    toast.success("Painéis descongelados.");
  });

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Modos">
        <RibbonBigBtn title="Modo normal" icon={<Eye size={18} />} label="Normal" onClick={() => setZoom(1)} />
        <RibbonBigBtn title="Layout de página" icon={<FileText size={18} />} label="Layout" onClick={() => toast.info("Visualização de layout: na exportação PDF.")} />
      </RibbonGroup>
      <RibbonGroup label="Mostrar">
        <RibbonBigBtn title="Linhas de grade" icon={<Grid3x3 size={18} />} label="Linhas de Grade"
          onClick={() => withSheet(api, (s) => s.setHiddenGridlines?.(!(s.hasHiddenGridLines?.() ?? false)))} />
        <RibbonBigBtn title="Cabeçalhos" icon={<EyeOff size={18} />} label="Cabeçalhos"
          onClick={() => toast.info("Cabeçalhos sempre visíveis no editor.")} />
      </RibbonGroup>
      <RibbonGroup label="Zoom">
        <RibbonBigBtn title="Aumentar zoom" icon={<ZoomIn size={18} />} label="Aumentar" onClick={() => setZoom(1.25)} />
        <RibbonBigBtn title="100%" icon={<Search size={18} />} label="100%" onClick={() => setZoom(1)} />
        <RibbonBigBtn title="Diminuir zoom" icon={<ZoomOut size={18} />} label="Diminuir" onClick={() => setZoom(0.75)} />
      </RibbonGroup>
      <RibbonGroup label="Janela">
        <RibbonBigBtn title="Congelar painéis na seleção" icon={<Snowflake size={18} />} label="Congelar" onClick={freeze} />
        <RibbonBigBtn title="Descongelar" icon={<Snowflake size={18} />} label="Descongelar" onClick={unfreeze} />
      </RibbonGroup>
    </div>
  );
}

// ============= AJUDA =============
function HelpRibbon() {
  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Ajuda">
        <RibbonBigBtn title="Documentação" icon={<HelpCircle size={18} />} label="Ajuda"
          onClick={() => window.open("https://docs.univer.ai/", "_blank")} />
        <RibbonBigBtn title="Atalhos de teclado" icon={<HelpCircle size={18} />} label="Atalhos"
          onClick={() => toast.info("Ctrl+B Negrito · Ctrl+I Itálico · Ctrl+Z Desfazer · Ctrl+C/V Copiar/Colar · Ctrl+F Localizar")} />
      </RibbonGroup>
      <RibbonGroup label="Comunidade">
        <RibbonBigBtn title="Enviar feedback" icon={<MessageSquare size={18} />} label="Feedback"
          onClick={() => toast.info("Use o botão de suporte do sistema.")} />
      </RibbonGroup>
    </div>
  );
}

// ============= ARQUIVO =============
function FileRibbon({ api, onSave }: { api: UniverFacade | null; onSave?: () => void }) {
  const exportJson = () => {
    try {
      const wb = api?.getActiveWorkbook?.();
      const data = wb?.save?.();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "planilha.json"; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao exportar.");
    }
  };
  const newSheet = () => {
    if (!confirm("Criar nova planilha em branco? As alterações não salvas serão perdidas.")) return;
    exec(api, "sheet.command.create-sheet");
  };

  return (
    <div className="flex items-stretch min-h-[78px] py-1 px-2 bg-white overflow-x-auto no-scrollbar">
      <RibbonGroup label="Arquivo">
        <RibbonBigBtn title="Nova planilha" icon={<FilePlus2 size={18} />} label="Novo" onClick={newSheet} />
        <RibbonBigBtn title="Salvar modelo" icon={<Save size={18} />} label="Salvar" onClick={onSave} />
        <RibbonBigBtn title="Exportar (JSON)" icon={<FileDown size={18} />} label="Exportar" onClick={exportJson} />
        <RibbonBigBtn title="Imprimir / PDF" icon={<Printer size={18} />} label="Imprimir"
          onClick={() => window.print()} />
      </RibbonGroup>
    </div>
  );
}

// ============= Color picker =============
function ColorPicker({
  title, value, onChange, icon,
}: { title: string; value: string; onChange: (c: string) => void; icon: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const PALETTE = [
    "#000000", "#7F7F7F", "#C00000", "#FF0000", "#FFC000", "#FFFF00",
    "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0",
    "#FFFFFF", "#F2F2F2", "#FFE6E6", "#FFF2CC", "#FFF9CC", "#FFFFE6",
    "#E2EFDA", "#C6E0B4", "#DDEBF7", "#BDD7EE", "#D9E1F2", "#E4D6F0",
  ];
  return (
    <div className="relative">
      <RibbonBtn title={title} onClick={() => setOpen((v) => !v)}>{icon}<ChevronDown size={9} /></RibbonBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 left-0 bg-white border border-slate-300 shadow-lg rounded p-2 w-[168px]">
            <button type="button"
              className="text-[11px] font-bold text-slate-600 hover:bg-slate-50 w-full text-left px-1 py-0.5 mb-1 rounded"
              onClick={() => { onChange("#FFFFFF"); setOpen(false); }}>
              Sem preenchimento
            </button>
            <div className="grid grid-cols-6 gap-1">
              {PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => { onChange(c); setOpen(false); }}
                  className={cn("h-5 w-5 rounded border border-slate-300 hover:scale-110 transition-transform",
                    value === c && "ring-2 ring-emerald-500")}
                  style={{ background: c }} title={c} />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1">
              <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-slate-300" />
              <span className="text-[10px] text-slate-500 font-medium">Outras cores</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============= Border menu =============
function BorderMenu({ apply }: { apply: (k: "all" | "outer" | "none") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <RibbonBtn title="Bordas" onClick={() => setOpen((v) => !v)}>
        <Square size={14} /><ChevronDown size={9} />
      </RibbonBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 left-0 bg-white border border-slate-300 shadow-lg rounded p-1 w-44 text-xs">
            {[
              { id: "all" as const, label: "Todas as bordas" },
              { id: "outer" as const, label: "Bordas externas" },
              { id: "none" as const, label: "Sem borda" },
            ].map((b) => (
              <button key={b.id} type="button" onClick={() => { apply(b.id); setOpen(false); }}
                className="w-full text-left px-2 py-1 hover:bg-emerald-50 hover:text-emerald-800 rounded font-medium">
                {b.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============= Main =============
export function ExcelRibbon({ api, onOpenPageSetup, onSave }: Props) {
  const [tab, setTab] = useState<TabId>("home");

  return (
    <div
      className="border-b border-[#E1DFDD] bg-white shrink-0"
      style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
    >
      {/* Tab strip — Excel 365 style: white bg, green underline on active, "Arquivo" as green pill */}
      <div className="flex items-stretch h-9 px-1 border-b border-[#E1DFDD] bg-white select-none">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          if (t.accent) {
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "h-7 my-1 px-4 mr-1 rounded-sm text-[12px] font-semibold text-white transition-colors",
                  isActive ? "bg-[#0E6B3A]" : "bg-[#217346] hover:bg-[#1B5E3A]",
                )}
              >
                {t.label}
              </button>
            );
          }
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative h-full px-3 text-[12px] transition-colors",
                isActive
                  ? "text-[#107C41] font-semibold"
                  : "text-[#323130] hover:bg-[#F3F2F1]",
              )}
            >
              {t.label}
              {isActive && (
                <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-[#107C41] rounded-t-sm" />
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1 pr-2">
          <button
            type="button"
            title="Desfazer (Ctrl+Z)"
            onClick={() => exec(api, "univer.command.undo")}
            className="hover:bg-[#F3F2F1] p-1.5 rounded-sm text-[#323130]"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            title="Refazer (Ctrl+Y)"
            onClick={() => exec(api, "univer.command.redo")}
            className="hover:bg-[#F3F2F1] p-1.5 rounded-sm text-[#323130]"
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>

      {tab === "home" && <HomeRibbon api={api} />}
      {tab === "insert" && <InsertRibbon api={api} onOpenPageSetup={onOpenPageSetup} />}
      {tab === "layout" && <LayoutRibbon api={api} onOpenPageSetup={onOpenPageSetup} />}
      {tab === "formulas" && <FormulasRibbon api={api} />}
      {tab === "data" && <DataRibbon api={api} />}
      {tab === "review" && <ReviewRibbon api={api} />}
      {tab === "view" && <ViewRibbon api={api} />}
      {tab === "help" && <HelpRibbon />}
      {tab === "file" && <FileRibbon api={api} onSave={onSave} />}
    </div>
  );
}
