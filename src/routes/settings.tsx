import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Settings, 
  Trash2, 
  Briefcase, 
  Layers,
  ShieldCheck,
  Wrench,
  Loader2, 
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Box,
  MoreVertical,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";
import { DocumentTemplatesPage } from "@/features/documentTemplates/pages/DocumentTemplatesPage";
import { CategoriesManager as CategoriesAdminPanel } from "@/components/settings/CategoriesManager";




export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Configurações | SAAS Almoxarifado" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("cargos");

  return (
    <AppLayout>
      <div className="p-2 sm:p-4 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 w-full overflow-x-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <Settings className="text-blue-600" />
              Configurações
            </h1>
            <p className="text-slate-500 font-medium">Personalize os parâmetros do sistema.</p>
          </div>
        </div>

        <div className="flex bg-white/80 backdrop-blur-md border border-slate-200/60 p-1 h-auto shadow-sm rounded-2xl w-full max-w-2xl overflow-x-auto no-scrollbar scroll-smooth mb-8">
          <button 
            onClick={() => setActiveTab("cargos")}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "cargos" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Cargos
          </button>
          <button 
            onClick={() => setActiveTab("epis")}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "epis" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            EPIs
          </button>
          <button 
            onClick={() => setActiveTab("ferramentas")}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "ferramentas" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Ferramentas
          </button>
          <button 
            onClick={() => setActiveTab("categorias")}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "categorias" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Categorias
          </button>
          <button 
            onClick={() => setActiveTab("documentos")}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "documentos" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Documentos
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === "cargos" && <JobRolesManager />}
          {activeTab === "epis" && <ProductModelsManager type="epi" />}
          {activeTab === "ferramentas" && <ProductModelsManager type="tool" />}
          {activeTab === "categorias" && <CategoriesAdminPanel />}
          {activeTab === "documentos" && <DocumentTemplatesPage />}
        </div>


      </div>
    </AppLayout>
  );
}

function JobRolesManager() {
  const { isAdmin, isProgramador } = useAuth();
  const canManageUsers = isAdmin || isProgramador;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newItemNumber, setNewItemNumber] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: string, name: string, item_number?: string } | null>(null);
  const [duplicateRoles, setDuplicateRoles] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["job_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_roles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, item_number }: { name: string, item_number?: string }) => {
      const { data, error } = await supabase
        .from("job_roles")
        .insert([{ name, item_number }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_roles"] });
      toast.success("Função cadastrada com sucesso!");
      setIsDialogOpen(false);
      setNewRoleName("");
      setNewItemNumber("");
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar função: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, item_number }: { id: string, name: string, item_number?: string }) => {
      const { error } = await supabase
        .from("job_roles")
        .update({ name, item_number })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_roles"] });
      toast.success("Função atualizada com sucesso!");
      setIsDialogOpen(false);
      setEditingRole(null);
      setNewRoleName("");
      setNewItemNumber("");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar função: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_roles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_roles"] });
      toast.success("Função excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Não é possível excluir esta função pois ela está em uso.");
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("job_roles")
        .delete()
        .not("id", "is", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_roles"] });
      toast.success("Todas as funções foram excluídas com sucesso!");
      setIsDeleteAllDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir funções: " + error.message);
    },
  });
  const handleExportExcel = () => {
    if (!roles || roles.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    const exportData = roles.map(role => ({
      "Função": role.name,
      "Data de Cadastro": new Date(role.created_at).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Funções");
    XLSX.writeFile(wb, "funcoes_cadastradas.xlsx");
    toast.success("Excel gerado com sucesso!");
  };

  const downloadTemplate = () => {
    const template = [
      { "Função": "0001 - Encarregado de Obras" },
      { "Função": "0002 - Técnico de Segurança" },
      { "Função": "0003 - Almoxarife" }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Funções");
    XLSX.writeFile(wb, "template_funcoes.xlsx");
    toast.success("Modelo baixado com sucesso!");
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length <= 1) {
        throw new Error("A planilha está vazia ou contém apenas o cabeçalho.");
      }

      // Extract from the first column, skipping the first row (header)
      const parsedRoles = jsonData
        .slice(1)
        .map(row => {
          const rawValue = String(row[0] || "").trim();
          if (!rawValue) return null;

          // Split "0008 - Pedeiro" into item_number="0008" and name="Pedeiro"
          const parts = rawValue.split(/\s*-\s*/);
          if (parts.length >= 2) {
            return {
              item_number: parts[0].trim(),
              name: parts.slice(1).join(" - ").trim()
            };
          }
          return {
            item_number: "",
            name: rawValue
          };
        })
        .filter((r): r is { item_number: string, name: string } => r !== null && r.name.length > 0);

      if (parsedRoles.length === 0) {
        throw new Error("Nenhuma função válida encontrada na primeira coluna.");
      }

      // Check for duplicates with existing roles
      const existingNamesSet = new Set(roles?.map(r => r.name.toLowerCase()));
      const duplicatesFound: string[] = [];
      const rolesToInsert: { name: string, item_number: string }[] = [];

      parsedRoles.forEach(parsed => {
        if (existingNamesSet.has(parsed.name.toLowerCase())) {
          if (!duplicatesFound.includes(parsed.name)) {
            duplicatesFound.push(parsed.name);
          }
        } else {
          if (!rolesToInsert.some(r => r.name === parsed.name)) {
            rolesToInsert.push(parsed);
          }
        }
      });

      if (duplicatesFound.length > 0) {
        setDuplicateRoles(duplicatesFound);
        setIsDuplicateDialogOpen(true);
        // Não fechamos o diálogo de importação ainda para que o usuário veja o feedback se quiser
      }

      if (rolesToInsert.length === 0) {
        if (duplicatesFound.length > 0) {
          toast.info("Todas as funções da planilha já estão cadastradas.");
        }
        setIsImportDialogOpen(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('job_roles')
        .insert(rolesToInsert);

      if (insertError) throw insertError;

      toast.success(`${rolesToInsert.length} novas funções importadas com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['job_roles'] });
      setIsImportDialogOpen(false);
    } catch (err: any) {
      console.error("Erro na importação:", err);
      toast.error(err.message || "Erro ao processar a planilha.");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Briefcase size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight whitespace-nowrap">Cargos / Funções</h2>
            <p className="text-xs text-slate-500 font-medium">Gerencie as funções disponíveis para os colaboradores.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
          <Button 
            variant="outline" 
            className="h-11 rounded-xl font-bold text-sm shadow-sm hover:shadow transition-all"
            onClick={handleExportExcel}
          >
            <Download size={16} className="mr-2" /> Exportar
          </Button>
          <Button 
            variant="outline"
            className="h-11 rounded-xl font-bold text-sm border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow transition-all"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload size={16} className="mr-2" /> Importar
          </Button>
          <Button 
            className="h-11 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all col-span-2 sm:col-span-1"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus size={16} className="mr-2" /> Nova Função
          </Button>
          {canManageUsers && (
            <Button
              variant="outline"
              className="h-11 rounded-xl font-bold text-sm border-red-200 text-red-600 hover:bg-red-50 shadow-sm hover:shadow transition-all col-span-2 sm:col-span-1"
              onClick={() => setIsDeleteAllDialogOpen(true)}
            >
              <Trash2 size={16} className="mr-2" /> Excluir Todas
            </Button>
          )}
        </div>
      </div>



      <div className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 px-6">Item</TableHead>
                <TableHead className="font-bold text-slate-700 px-6">Nome da Função</TableHead>
                <TableHead className="font-bold text-slate-700 px-6 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                  </TableCell>
                </TableRow>
              ) : roles?.length === 0 ? (
                <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-slate-400 font-medium">
                  Nenhuma função cadastrada.
                </TableCell>
                </TableRow>
              ) : (
                roles?.map((role) => (
                  <TableRow key={role.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="px-6 py-4 font-bold text-slate-500">{(role as any).item_number || "-"}</TableCell>
                    <TableCell className="px-6 py-4 font-bold text-slate-700">{role.name}</TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem 
                            className="font-bold text-slate-700 cursor-pointer"
                            onClick={() => {
                              setEditingRole({ id: role.id, name: role.name, item_number: (role as any).item_number });
                              setNewRoleName(role.name);
                              setNewItemNumber((role as any).item_number || "");
                              setIsDialogOpen(true);
                            }}
                          >
                            <Pencil size={14} className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="font-bold text-red-500 cursor-pointer focus:text-red-600 focus:bg-red-50"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta função?")) {
                                deleteMutation.mutate(role.id);
                              }
                            }}
                          >
                            <Trash2 size={14} className="mr-2" /> Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingRole(null);
          setNewRoleName("");
          setNewItemNumber("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingRole ? "Editar Função" : "Nova Função"}
            </DialogTitle>
            <DialogDescription className="font-medium">
              {editingRole ? "Altere o nome da função selecionada." : "Insira o nome da nova função para cadastro."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Item</label>
              <Input 
                placeholder="Ex: 01" 
                className="rounded-xl h-12 font-bold"
                value={newItemNumber}
                onChange={(e) => setNewItemNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Nome da Função</label>
              <Input 
                placeholder="Ex: Encarregado de Obras" 
                className="rounded-xl h-12 font-bold"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRoleName.trim()) {
                    if (editingRole) {
                      updateMutation.mutate({ id: editingRole.id, name: newRoleName.trim(), item_number: newItemNumber });
                    } else {
                      createMutation.mutate({ name: newRoleName.trim(), item_number: newItemNumber });
                    }
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              className="rounded-xl font-bold"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8"
              onClick={() => {
                if (newRoleName.trim()) {
                  if (editingRole) {
                    updateMutation.mutate({ id: editingRole.id, name: newRoleName.trim(), item_number: newItemNumber });
                  } else {
                    createMutation.mutate({ name: newRoleName.trim(), item_number: newItemNumber });
                  }
                } else {
                  toast.error("Informe o nome da função");
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <FileSpreadsheet size={24} />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900">Importar Funções</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium">
              Carregue uma planilha Excel (.xlsx ou .csv). O sistema lerá apenas a primeira coluna como o nome das funções.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div 
              className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer relative"
              onClick={() => document.getElementById('roles-upload')?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-600">Processando planilha...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <Upload className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-xs text-slate-400">Formatos aceitos: .xlsx, .xls, .csv</p>
                </div>
              )}
              <input 
                id="roles-upload" 
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleImportExcel}
                disabled={isUploading}
              />
            </div>

            <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100/50">
              <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 size={14} /> Dicas para a Planilha
              </h4>
              <ul className="text-xs text-blue-600/80 space-y-2.5 font-bold">
                <li className="flex items-center gap-2">• A primeira coluna deve conter os nomes das funções</li>
                <li className="flex items-center gap-2">• A primeira linha será ignorada (cabeçalho)</li>
                <li className="flex items-center gap-2">• Funções duplicadas serão ignoradas automaticamente</li>
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full mt-6 bg-white border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl font-bold h-11"
                onClick={downloadTemplate}
              >
                <Download size={16} className="mr-2" /> Baixar Modelo Exemplo
              </Button>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              variant="ghost" 
              className="rounded-xl font-bold text-slate-400 hover:text-slate-600"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900">Funções já Cadastradas</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium">
              Abaixo estão as funções identificadas na sua planilha que já constam no banco de dados. Elas não foram duplicadas.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-3 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center px-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Função Identificada</span>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Status</span>
            </div>
            <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
              {duplicateRoles.map((role, index) => (
                <div key={index} className="p-3 bg-white rounded-xl text-sm font-bold text-slate-700 border border-slate-50 flex items-center justify-between group hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                      <Briefcase size={14} />
                    </div>
                    {role}
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-black uppercase">
                    Já Cadastrada
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button 
              className="bg-slate-900 hover:bg-slate-800 rounded-xl font-bold px-8 h-12"
              onClick={() => setIsDuplicateDialogOpen(false)}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-red-600 flex items-center gap-2">
              <AlertCircle size={22} /> Excluir Todas as Funções
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-600">
              Esta ação irá apagar <strong>permanentemente</strong> todas as funções cadastradas. Esta operação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-500 font-medium">
              Funções a serem apagadas: <strong>{roles?.length ?? 0}</strong>
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              className="rounded-xl font-bold"
              onClick={() => setIsDeleteAllDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold px-8 bg-red-600 hover:bg-red-700"
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending || (roles?.length ?? 0) === 0}
            >
              {deleteAllMutation.isPending ? "Excluindo..." : "Excluir Todas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoriesManager() {
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir categoria. Verifique se existem produtos vinculados.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, type }: { id: string, name: string, type: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ name, type })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Categorias</h2>
            <p className="text-xs text-slate-500 font-medium">Modelos prontos de EPIs e Ferramentas.</p>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Editar Categoria</DialogTitle>
            <DialogDescription className="font-medium">
              Atualize o nome ou tipo da categoria.
            </DialogDescription>
          </DialogHeader>
          
          {editingCategory && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Nome da Categoria</label>
                <Input 
                  className="rounded-xl h-12 font-bold"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Tipo</label>
                <select 
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingCategory.type}
                  onChange={(e) => setEditingCategory({...editingCategory, type: e.target.value})}
                >
                  <option value="epi">EPI</option>
                  <option value="tool">Ferramenta</option>
                </select>
              </div>

              <DialogFooter className="mt-6">
                <Button 
                  variant="ghost" 
                  className="rounded-xl font-bold"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8"
                  onClick={() => updateMutation.mutate(editingCategory)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
      </div>

      <div className="flex-1 p-0 overflow-y-auto max-h-[600px]">
        <Table>
          <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="font-bold text-slate-700 px-6">Categoria</TableHead>
              <TableHead className="font-bold text-slate-700 px-6">Tipo</TableHead>
              <TableHead className="font-bold text-slate-700 px-6 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                </TableCell>
              </TableRow>
            ) : categories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-slate-400 font-medium">
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              categories?.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="px-6 py-4 font-bold text-slate-700">{cat.name}</TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      cat.type === 'epi' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                    )}>
                      {cat.type === 'epi' ? 'EPI' : 'FERRAMENTA'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-lg">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem 
                          className="font-bold text-slate-700 cursor-pointer"
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil size={14} className="mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="font-bold text-red-500 cursor-pointer focus:text-red-600 focus:bg-red-50"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta categoria?")) {
                              deleteMutation.mutate(cat.id);
                            }
                          }}
                        >
                          <Trash2 size={14} className="mr-2" /> Apagar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProductModelsManager({ type }: { type: 'epi' | 'tool' }) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editingModel, setEditingModel] = useState<any>(null);
  const emptyNewModel = { name: "", sku: "", item_number: "", category_id: "", min_quantity: 0 };
  const [newModel, setNewModel] = useState<any>(emptyNewModel);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("type", type)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: models, isLoading: isLoadingModels } = useQuery({
    queryKey: ["product_models", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_models")
        .select(`
          *,
          categories!inner(*)
        `)
        .eq("categories.type", type)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_models")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_models", type] });
      toast.success("Modelo excluído com sucesso!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const { id, categories, created_at, updated_at, ...data } = values;
      const { error } = await supabase
        .from("product_models")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_models", type] });
      toast.success("Modelo atualizado com sucesso!");
      setIsEditModalOpen(false);
      setEditingModel(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar modelo: " + error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!values.name?.trim()) throw new Error("Informe o nome/descrição.");
      if (!values.category_id) throw new Error("Selecione uma categoria.");
      const { error } = await supabase
        .from("product_models")
        .insert({
          name: values.name.trim(),
          sku: values.sku?.trim() || null,
          item_number: values.item_number?.trim() || null,
          category_id: values.category_id,
          min_quantity: Number(values.min_quantity) || 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_models", type] });
      toast.success("Modelo cadastrado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewModel(emptyNewModel);
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar modelo: " + error.message);
    },
  });

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length <= 1) throw new Error("A planilha está vazia.");

      const modelsToImport = jsonData
        .slice(1)
        .map(row => {
          const item = String(row[0] || "").trim();
          const sku = String(row[1] || "").trim();
          const name = String(row[2] || "").trim();
          const categoryRef = String(row[3] || "").trim();
          
          return { item, sku, name, categoryRef };
        })
        .filter(m => m.name.length > 0);

      if (modelsToImport.length === 0) throw new Error("Nenhum modelo encontrado.");

      const { data: allCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', type);

      const itemsToInsert = modelsToImport.map(m => {
        let categoryId = selectedCategoryId;
        
        // Se houver uma referência de categoria na 4ª coluna (ex: "01", "1", "Proteção...")
        if (m.categoryRef && allCategories) {
          const foundCategory = allCategories.find(cat => 
            cat.name.startsWith(m.categoryRef) || 
            cat.name.includes(m.categoryRef)
          );
          if (foundCategory) {
            categoryId = foundCategory.id;
          }
        }

        return { 
          name: m.name, 
          sku: m.sku,
          item_number: m.item,
          category_id: categoryId
        };
      }).filter(item => item.category_id); // Garante que temos uma categoria

      if (itemsToInsert.length === 0) {
        throw new Error("Não foi possível determinar a categoria para os itens. Selecione uma categoria padrão ou informe na planilha.");
      }

      const { error } = await supabase
        .from('product_models')
        .insert(itemsToInsert);

      if (error) throw error;

      toast.success(`${itemsToInsert.length} modelos importados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['product_models', type] });
      setIsImportDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar.");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl",
            type === 'epi' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
          )}>
            {type === 'epi' ? <ShieldCheck size={20} /> : <Wrench size={20} />}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Modelos de {type === 'epi' ? 'EPIs' : 'Ferramentas'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Cadastre descrições predefinidas.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-bold border-slate-200"
            onClick={() => { setNewModel({ ...emptyNewModel }); setIsCreateDialogOpen(true); }}
          >
            <Plus size={16} className="mr-2" /> Novo Modelo
          </Button>
          <Button
            className={cn(
              "rounded-xl font-bold",
              type === 'epi' ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
            )}
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload size={16} className="mr-2" /> Importar Excel
          </Button>
        </div>
      </div>

      <div className="flex-1 p-0 overflow-y-auto max-h-[600px]">
        <Table>
          <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="font-bold text-slate-700 px-6">Item</TableHead>
              <TableHead className="font-bold text-slate-700 px-6">Código / SKU</TableHead>
              <TableHead className="font-bold text-slate-700 px-6">Modelo / Descrição</TableHead>
              <TableHead className="font-bold text-slate-700 px-6">Categoria</TableHead>
              <TableHead className="font-bold text-slate-700 px-6 text-center">Qtd. Mínima</TableHead>
              <TableHead className="font-bold text-slate-700 px-6 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingModels ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                </TableCell>
              </TableRow>
            ) : models?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                  Nenhum modelo cadastrado. Clique em "Novo Modelo" ou "Importar Excel".
                </TableCell>
              </TableRow>
            ) : (
              models?.map((model: any) => (
                <TableRow key={model.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="px-6 py-4 font-bold text-slate-500">{model.item_number || "-"}</TableCell>
                  <TableCell className="px-6 py-4 font-mono text-blue-600 font-bold">{model.sku || "-"}</TableCell>
                  <TableCell className="px-6 py-4 font-bold text-slate-700">{model.name}</TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 text-slate-600">
                      {model.categories?.name?.split('.')[0] || model.categories?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-lg font-black text-sm",
                      (model.min_quantity ?? 0) > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-400"
                    )}>
                      {model.min_quantity ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-lg">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem 
                          className="font-bold text-slate-700 cursor-pointer"
                          onClick={() => {
                            setEditingModel(model);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Pencil size={14} className="mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="font-bold text-red-500 cursor-pointer focus:text-red-600 focus:bg-red-50"
                          onClick={() => {
                            if (confirm("Deseja excluir este modelo?")) {
                              deleteMutation.mutate(model.id);
                            }
                          }}
                        >
                          <Trash2 size={14} className="mr-2" /> Apagar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase">Importar {type === 'epi' ? 'EPIs' : 'Ferramentas'}</DialogTitle>
            <DialogDescription className="font-medium">
              Selecione uma categoria padrão ou informe o número/nome na 4ª coluna da planilha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Categoria Alvo</label>
              <select 
                className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="">Selecione uma categoria...</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div 
              className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={() => document.getElementById('models-upload')?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">Clique para carregar .xlsx</p>
                </div>
              )}
              <input 
                id="models-upload" 
                type="file" 
                className="hidden" 
                accept=".xlsx" 
                onChange={handleImportExcel}
                disabled={isUploading || !selectedCategoryId}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="w-full bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold h-11"
              onClick={() => {
                const template = [
                  { "Item": "01", "Código": "01.001", "Descrição": "Capacete de Segurança", "Categoria": "01" },
                  { "Item": "02", "Código": "01.002", "Descrição": "Capacete com Jugular", "Categoria": "01" }
                ];
                const ws = XLSX.utils.json_to_sheet(template);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Modelos");
                XLSX.writeFile(wb, `template_${type}.xlsx`);
                toast.success("Modelo baixado com sucesso!");
              }}
            >
              <Download size={16} className="mr-2" /> Baixar Modelo Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase">Editar Modelo</DialogTitle>
            <DialogDescription className="font-medium">
              Atualize as informações do modelo.
            </DialogDescription>
          </DialogHeader>

          {editingModel && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Nome / Descrição</label>
                <Input 
                  className="rounded-xl h-12 font-bold"
                  value={editingModel.name}
                  onChange={(e) => setEditingModel({...editingModel, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase">Número Item</label>
                  <Input 
                    className="rounded-xl h-12 font-bold"
                    value={editingModel.item_number || ""}
                    onChange={(e) => setEditingModel({...editingModel, item_number: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase">Código / SKU</label>
                  <Input 
                    className="rounded-xl h-12 font-bold"
                    value={editingModel.sku || ""}
                    onChange={(e) => setEditingModel({...editingModel, sku: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase">Categoria</label>
                  <select
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingModel.category_id}
                    onChange={(e) => setEditingModel({...editingModel, category_id: e.target.value})}
                  >
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 w-32">
                  <label className="text-xs font-black text-slate-500 uppercase">Qtd. Mínima</label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-xl h-12 font-bold text-center"
                    value={editingModel.min_quantity ?? 0}
                    onChange={(e) => setEditingModel({...editingModel, min_quantity: Number(e.target.value) || 0})}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button 
                  variant="ghost" 
                  className="rounded-xl font-bold"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className={cn(
                    "rounded-xl font-bold px-8",
                    type === 'epi' ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
                  )}
                  onClick={() => updateMutation.mutate(editingModel)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase">
              Novo Modelo de {type === 'epi' ? 'EPI' : 'Ferramenta'}
            </DialogTitle>
            <DialogDescription className="font-medium">
              Cadastre manualmente, sem precisar importar planilha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Nome / Descrição *</label>
              <Input
                className="rounded-xl h-12 font-bold"
                placeholder="Ex: Capacete de Segurança Branco"
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Número Item</label>
                <Input
                  className="rounded-xl h-12 font-bold"
                  placeholder="01"
                  value={newModel.item_number}
                  onChange={(e) => setNewModel({ ...newModel, item_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Código / SKU</label>
                <Input
                  className="rounded-xl h-12 font-bold"
                  placeholder="01.001"
                  value={newModel.sku}
                  onChange={(e) => setNewModel({ ...newModel, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Categoria *</label>
                <select
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newModel.category_id}
                  onChange={(e) => setNewModel({ ...newModel, category_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 w-32">
                <label className="text-xs font-black text-slate-500 uppercase">Qtd. Mínima</label>
                <Input
                  type="number"
                  min={0}
                  className="rounded-xl h-12 font-bold text-center"
                  value={newModel.min_quantity}
                  onChange={(e) => setNewModel({ ...newModel, min_quantity: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="ghost"
                className="rounded-xl font-bold"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className={cn(
                  "rounded-xl font-bold px-8",
                  type === 'epi' ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
                )}
                onClick={() => createMutation.mutate(newModel)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
