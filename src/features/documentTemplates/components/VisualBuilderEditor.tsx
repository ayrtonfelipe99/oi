import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Loader2, Save, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBuilderTemplate,
  updateBuilderConfig,
} from "../services/templateService";
import {
  DOCUMENT_TEMPLATE_TYPE_LABEL,
  type DocumentTemplate,
  type DocumentTemplateType,
} from "../types/documentTemplateTypes";
import {
  DEFAULT_PAGE_SETUP,
  PageSetupDialog,
  type PageSetup,
} from "./PageSetupDialog";
import { ExcelRibbon, type UniverFacade } from "./ExcelRibbon";
import { VariablesPanel } from "./VariablesPanel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DocumentTemplateType;
  template?: DocumentTemplate | null;
}

interface BuilderPayload {
  univer: Record<string, unknown>;
  pageSetup: PageSetup;
}

function readBuilderConfig(cfg: Record<string, unknown> | null | undefined): {
  snapshot: Record<string, unknown> | null;
  pageSetup: PageSetup;
} {
  if (!cfg || Object.keys(cfg).length === 0) {
    return { snapshot: null, pageSetup: DEFAULT_PAGE_SETUP };
  }
  if (cfg.univer && typeof cfg.univer === "object") {
    return {
      snapshot: cfg.univer as Record<string, unknown>,
      pageSetup: {
        ...DEFAULT_PAGE_SETUP,
        ...((cfg.pageSetup as Partial<PageSetup>) ?? {}),
        margins: {
          ...DEFAULT_PAGE_SETUP.margins,
          ...(((cfg.pageSetup as PageSetup) ?? {}).margins ?? {}),
        },
      },
    };
  }
  return { snapshot: cfg, pageSetup: DEFAULT_PAGE_SETUP };
}

type UniverHandle = {
  dispose: () => void;
  getSnapshot: () => Record<string, unknown>;
  api: UniverFacade;
};

async function mountUniver(
  container: HTMLDivElement,
  initialSnapshot?: Record<string, unknown> | null,
): Promise<UniverHandle> {
  const [{ createUniver, LocaleType, defaultTheme }, { UniverSheetsCorePreset }, localeEnUS] =
    await Promise.all([
      import("@univerjs/presets"),
      import("@univerjs/preset-sheets-core"),
      import("@univerjs/preset-sheets-core/locales/en-US"),
    ]);
  await import("@univerjs/preset-sheets-core/lib/index.css" as any);

  const { univerAPI, univer } = createUniver({
    locale: LocaleType.EN_US,
    locales: { [LocaleType.EN_US]: { ...(localeEnUS as any).default } },
    theme: defaultTheme,
    presets: [
      UniverSheetsCorePreset({
        container,
        // Disable Univer's native chrome — our custom Excel ribbon replaces it.
        header: false,
        toolbar: false,
        menu: {} as any,
        contextMenu: true,
        formulaBar: true,
        footer: true,
        statusBarStatistic: true,
      } as any),
    ],
  });

  const hasSnapshot =
    initialSnapshot && Object.keys(initialSnapshot).length > 0;
  if (hasSnapshot) {
    try {
      univerAPI.createWorkbook(initialSnapshot as any);
    } catch (e) {
      console.error("[VisualBuilder] falha ao carregar snapshot, criando novo", e);
      univerAPI.createWorkbook({});
    }
  } else {
    univerAPI.createWorkbook({});
  }

  return {
    dispose: () => {
      try {
        univer.dispose();
      } catch (e) {
        console.error("[VisualBuilder] dispose error", e);
      }
    },
    getSnapshot: () => {
      const wb = univerAPI.getActiveWorkbook();
      if (!wb) throw new Error("Nenhuma planilha ativa.");
      return wb.save() as unknown as Record<string, unknown>;
    },
    api: univerAPI as UniverFacade,
  };
}

const PAPER_LABEL: Record<PageSetup["paperSize"], string> = {
  A4: "A4",
  A3: "A3",
  Letter: "Carta",
  Legal: "Ofício",
};

export function VisualBuilderEditor({ open, onOpenChange, type, template }: Props) {
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<UniverHandle | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(template?.name ?? "");
  const [version, setVersion] = useState(template?.version ?? "1");
  const [pageSetup, setPageSetup] = useState<PageSetup>(DEFAULT_PAGE_SETUP);
  const [pageSetupOpen, setPageSetupOpen] = useState(false);
  const [apiReady, setApiReady] = useState<UniverFacade | null>(null);
  const isEditing = !!template;

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? "");
    setVersion(template?.version ?? "1");

    const parsed = readBuilderConfig(
      (template?.builder_config as Record<string, unknown>) ?? null,
    );
    setPageSetup(parsed.pageSetup);

    let cancelled = false;
    setLoading(true);
    setApiReady(null);
    const init = async () => {
      await new Promise((r) => setTimeout(r, 30));
      if (cancelled || !containerRef.current) return;
      try {
        const h = await mountUniver(containerRef.current, parsed.snapshot);
        if (cancelled) {
          h.dispose();
          return;
        }
        handleRef.current = h;
        setApiReady(h.api);
      } catch (e: any) {
        console.error("[VisualBuilder] mount error", e);
        toast.error("Falha ao carregar o editor: " + (e.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
      setApiReady(null);
    };
  }, [open, template?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!handleRef.current) throw new Error("Editor ainda não está pronto.");
      if (!name.trim()) throw new Error("Informe o nome do modelo.");
      const snapshot = handleRef.current.getSnapshot();
      const payload: BuilderPayload = { univer: snapshot, pageSetup };
      if (isEditing && template) {
        await updateBuilderConfig(template.id, payload as unknown as Record<string, unknown>, {
          name,
          version,
        });
        return template.id;
      }
      const created = await createBuilderTemplate({
        name,
        type,
        version,
        builder_config: payload as unknown as Record<string, unknown>,
      });
      return created.id;
    },
    onSuccess: () => {
      toast.success(isEditing ? "Modelo atualizado." : "Modelo salvo.");
      qc.invalidateQueries({ queryKey: ["document-templates"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar."),
  });

  const pageBadge = `${PAPER_LABEL[pageSetup.paperSize]} · ${
    pageSetup.orientation === "portrait" ? "Retrato" : "Paisagem"
  }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1500px,calc(100vw-16px))] w-[calc(100vw-16px)] h-[calc(100dvh-16px)] p-0 gap-0 overflow-hidden rounded-2xl flex flex-col">
        {/* Hide Univer's native ribbon (the one with Start/Formulas/Data tabs).
            The sheet body, formula bar, column headers and status bar MUST stay visible. */}
        <style>{`
          /* Univer's native ribbon is already disabled via preset config
             (header: false, toolbar: false). This CSS only catches edge cases
             without touching the sheet container, column header or formula bar. */
          .univer-excel-host > div > header:first-child,
          .univer-excel-host [class*="univer-ribbon"],
          .univer-excel-host [class*="univer-menu-bar"],
          .univer-excel-host [data-u-comp="ribbon"] {
            display: none !important;
          }
        `}</style>

        {/* Slim Excel-style title bar — replaces the colored DialogHeader + form bar */}
        <DialogHeader
          data-app-header
          className="h-9 px-2 flex flex-row items-center gap-2 border-b border-[#E1DFDD] bg-[#F3F2F1] shrink-0 space-y-0"
          style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
        >
          <div className="w-5 h-5 rounded-sm bg-[#217346] flex items-center justify-center shrink-0">
            <Sparkles size={11} className="text-white" />
          </div>
          <DialogTitle className="sr-only">
            {isEditing ? "Editar modelo" : "Novo modelo"} — {DOCUMENT_TEMPLATE_TYPE_LABEL[type]}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Editor de planilha estilo Excel para o modelo de {DOCUMENT_TEMPLATE_TYPE_LABEL[type]}.
          </DialogDescription>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Nome do modelo — ${DOCUMENT_TEMPLATE_TYPE_LABEL[type]}`}
            className="h-6 text-[12px] px-2 bg-transparent border-transparent hover:bg-white focus:bg-white focus-visible:ring-1 focus-visible:ring-[#217346] rounded-sm max-w-[420px] font-medium text-[#323130]"
          />
          <span className="text-[11px] text-[#605E5C] hidden md:inline">— {DOCUMENT_TEMPLATE_TYPE_LABEL[type]}</span>

          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-[#605E5C] mr-1 hidden sm:inline">v</span>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="h-6 w-12 text-[11px] px-1.5 text-center bg-transparent border-[#E1DFDD] hover:bg-white focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setPageSetupOpen(true)}
              className="h-7 px-2 text-[11px] text-[#323130] hover:bg-[#E1DFDD] rounded-sm flex items-center gap-1.5"
              title="Layout da página"
            >
              <FileText size={12} />
              {pageBadge}
            </button>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || loading}
              className="h-7 px-3 text-[11px] font-semibold text-white bg-[#217346] hover:bg-[#1B5E3A] disabled:opacity-50 rounded-sm flex items-center gap-1.5"
              title="Salvar (Ctrl+S)"
            >
              {save.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending}
              className="h-7 px-2 text-[11px] text-[#323130] hover:bg-[#E81123] hover:text-white rounded-sm"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </DialogHeader>

        <Label htmlFor="hidden-label" className="sr-only">{name}</Label>

        {/* Excel-style ribbon */}
        <ExcelRibbon
          api={apiReady}
          onOpenPageSetup={() => setPageSetupOpen(true)}
          onSave={() => save.mutate()}
        />

        <div className="flex-1 min-h-0 flex">
          <div className="relative flex-1 min-w-0 bg-white">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin" />
                  <p className="text-sm font-bold">Carregando editor…</p>
                </div>
              </div>
            )}
            <div ref={containerRef} className="absolute inset-0 univer-excel-host" />
          </div>
          <VariablesPanel type={type} api={apiReady} />
        </div>

        <PageSetupDialog
          open={pageSetupOpen}
          onOpenChange={setPageSetupOpen}
          value={pageSetup}
          onChange={setPageSetup}
        />
      </DialogContent>
    </Dialog>
  );
}
