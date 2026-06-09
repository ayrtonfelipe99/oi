import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Tag, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DocumentTemplateType } from "../types/documentTemplateTypes";
import type { UniverFacade } from "./ExcelRibbon";

interface VariableDef {
  token: string;
  label: string;
  example?: string;
}
interface VariableGroup {
  key: string;
  label: string;
  items: VariableDef[];
}

const COMMON: VariableGroup[] = [
  {
    key: "colaborador",
    label: "Colaborador",
    items: [
      { token: "{{colaborador.nome}}", label: "Nome completo", example: "João da Silva" },
      { token: "{{colaborador.cpf}}", label: "CPF", example: "000.000.000-00" },
      { token: "{{colaborador.rg}}", label: "RG" },
      { token: "{{colaborador.matricula}}", label: "Matrícula" },
      { token: "{{colaborador.cargo}}", label: "Cargo" },
      { token: "{{colaborador.setor}}", label: "Setor" },
      { token: "{{colaborador.admissao}}", label: "Data de admissão" },
      { token: "{{colaborador.email}}", label: "E-mail" },
      { token: "{{colaborador.telefone}}", label: "Telefone" },
    ],
  },
  {
    key: "empresa",
    label: "Empresa",
    items: [
      { token: "{{empresa.razao_social}}", label: "Razão social" },
      { token: "{{empresa.cnpj}}", label: "CNPJ" },
      { token: "{{empresa.endereco}}", label: "Endereço" },
      { token: "{{empresa.cidade}}", label: "Cidade" },
      { token: "{{empresa.uf}}", label: "UF" },
    ],
  },
  {
    key: "documento",
    label: "Documento",
    items: [
      { token: "{{documento.numero}}", label: "Número do documento" },
      { token: "{{documento.data_emissao}}", label: "Data de emissão" },
      { token: "{{documento.data_atual}}", label: "Data atual", example: "07/06/2026" },
      { token: "{{documento.responsavel}}", label: "Responsável" },
      { token: "{{documento.observacoes}}", label: "Observações" },
    ],
  },
];

const EPI: VariableGroup = {
  key: "epi",
  label: "EPI",
  items: [
    { token: "{{epi.nome}}", label: "Nome do EPI" },
    { token: "{{epi.ca}}", label: "Certificado de Aprovação (CA)" },
    { token: "{{epi.validade_ca}}", label: "Validade do CA" },
    { token: "{{epi.fabricante}}", label: "Fabricante" },
    { token: "{{epi.tamanho}}", label: "Tamanho" },
    { token: "{{epi.quantidade}}", label: "Quantidade" },
    { token: "{{epi.data_entrega}}", label: "Data de entrega" },
    { token: "{{epi.data_devolucao}}", label: "Data de devolução" },
  ],
};

const TOOL: VariableGroup = {
  key: "ferramenta",
  label: "Ferramenta",
  items: [
    { token: "{{ferramenta.nome}}", label: "Nome da ferramenta" },
    { token: "{{ferramenta.modelo}}", label: "Modelo" },
    { token: "{{ferramenta.patrimonio}}", label: "Patrimônio" },
    { token: "{{ferramenta.serie}}", label: "Número de série" },
    { token: "{{ferramenta.fabricante}}", label: "Fabricante" },
    { token: "{{ferramenta.estado}}", label: "Estado de conservação" },
    { token: "{{ferramenta.data_entrega}}", label: "Data de entrega" },
    { token: "{{ferramenta.data_devolucao}}", label: "Data de devolução" },
  ],
};

function groupsFor(type: DocumentTemplateType): VariableGroup[] {
  if (type === "epi") return [...COMMON, EPI];
  if (type === "tool") return [...COMMON, TOOL];
  return [...COMMON, EPI, TOOL];
}

interface Props {
  type: DocumentTemplateType;
  api: UniverFacade | null;
}

export function VariablesPanel({ type, api }: Props) {
  const groups = useMemo(() => groupsFor(type), [type]);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(groups.map((g) => [g.key, true])),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.token.toLowerCase().includes(q) ||
            i.label.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  const insertToken = (token: string) => {
    if (!api) {
      toast.error("Editor ainda carregando.");
      return;
    }
    try {
      const wb = api.getActiveWorkbook?.();
      const sheet = wb?.getActiveSheet?.();
      const range = sheet?.getActiveRange?.();
      if (!range) {
        navigator.clipboard?.writeText(token);
        toast.info("Sem célula selecionada — copiado para a área de transferência.");
        return;
      }
      const current = range.getValue?.();
      const next = current ? `${current}${token}` : token;
      range.setValue?.(next);
      toast.success(`Inserido: ${token}`);
    } catch (e: any) {
      navigator.clipboard?.writeText(token);
      toast.info("Copiado para a área de transferência.");
    }
  };

  const copyToken = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(token);
    toast.success("Copiado");
  };

  if (collapsed) {
    return (
      <div className="w-9 border-l border-slate-200 bg-slate-50 flex flex-col items-center py-2 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
          title="Mostrar variáveis"
        >
          <Tag size={16} />
        </button>
        <div className="mt-2 text-[10px] font-bold text-slate-500 [writing-mode:vertical-rl] rotate-180">
          VARIÁVEIS
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 border-l border-slate-200 bg-slate-50 flex flex-col shrink-0">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-1.5">
          <Tag size={13} className="text-emerald-700" />
          <span className="text-xs font-bold text-slate-700">Variáveis</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 hover:bg-slate-100 rounded text-slate-500"
          title="Recolher"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="px-2 py-2 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar variável…"
            className="h-7 text-xs pl-7"
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
          Clique para inserir na célula selecionada.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Nada encontrado.</p>
        )}
        {filtered.map((g) => {
          const open = openGroups[g.key] ?? true;
          return (
            <div key={g.key}>
              <button
                onClick={() =>
                  setOpenGroups((s) => ({ ...s, [g.key]: !open }))
                }
                className="w-full flex items-center gap-1 px-1.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 rounded uppercase tracking-wide"
              >
                {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {g.label}
                <span className="ml-auto text-[10px] text-slate-400 font-medium">
                  {g.items.length}
                </span>
              </button>
              {open && (
                <ul className="mt-0.5 space-y-0.5">
                  {g.items.map((it) => (
                    <li key={it.token}>
                      <button
                        onClick={() => insertToken(it.token)}
                        className={cn(
                          "group w-full text-left px-2 py-1 rounded text-xs",
                          "hover:bg-emerald-100 hover:text-emerald-900 transition",
                          "flex items-center gap-1.5",
                        )}
                        title={`Inserir ${it.token}`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-slate-700 group-hover:text-emerald-900 truncate">
                            {it.label}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono truncate">
                            {it.token}
                          </span>
                        </span>
                        <span
                          onClick={(e) => copyToken(it.token, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded"
                          title="Copiar"
                          role="button"
                        >
                          <Copy size={11} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-3 py-2 border-t border-slate-200 bg-white">
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-[11px] font-bold"
          onClick={() => {
            const all = groups.flatMap((g) => g.items.map((i) => i.token)).join("\n");
            navigator.clipboard?.writeText(all);
            toast.success("Lista copiada");
          }}
        >
          <Copy size={11} className="mr-1.5" />
          Copiar todas
        </Button>
      </div>
    </aside>
  );
}
