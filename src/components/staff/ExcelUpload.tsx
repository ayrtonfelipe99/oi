import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Download,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ExcelUploadProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExcelUpload({ isOpen, onOpenChange, onSuccess }: ExcelUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const template = [
      {
        "Nº": 1,
        "MATRÍCULA": "12345",
        "CC": "OS-123",
        "NOME": "João da Silva",
        "FUNÇÃO": "Técnico de Segurança",
        "ADMISSÃO": "2024-01-15",
        "TELEFONE": "(11) 99999-9999",
        "CPF": "123.456.789-00",
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Colaboradores");
    XLSX.writeFile(wb, "template_colaboradores.xlsx");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' }) as any[];

      if (jsonData.length === 0) {
        throw new Error("A planilha está vazia.");
      }

      const parseDate = (v: any): string | null => {
        if (!v) return null;
        if (v instanceof Date) return v.toISOString();
        if (typeof v === 'number') {
          // Excel serial date
          const d = new Date(Math.round((v - 25569) * 86400 * 1000));
          return isNaN(d.getTime()) ? null : d.toISOString();
        }
        const s = String(v).trim();
        // try dd/mm/yyyy
        const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}`).toISOString();
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d.toISOString();
      };

      // Map excel headers to database columns
      const staffData = jsonData.map(row => {
        const roleName = row["FUNÇÃO"] || row["Função"] || row["funcao"] || row["Cargo"] || "";
        return {
          full_name: row["NOME"] || row["Nome"] || row["Nome Completo"],
          registration_number: String(row["MATRÍCULA"] ?? row["Matrícula"] ?? row["matricula"] ?? "").trim(),
          cpf: String(row["CPF"] ?? row["cpf"] ?? "").trim(),
          role: roleName,
          cost_center: String(row["CC"] ?? row["CC (O.S)"] ?? row["cc"] ?? row["os"] ?? "").trim(),
          status: "active",
          phone: String(row["TELEFONE"] ?? row["Telefone"] ?? row["telefone"] ?? "").trim(),
          admission_date: parseDate(row["ADMISSÃO"] || row["Admissão"] || row["Data Admissão"] || row["data_admissao"]),
        };
      }).filter(item => item.full_name);



      if (staffData.length === 0) {
        throw new Error("Nenhum dado válido encontrado na planilha. Verifique os nomes das colunas.");
      }

      const { error: insertError } = await supabase
        .from('staff')
        .insert(staffData);

      if (insertError) throw insertError;

      toast.success(`${staffData.length} colaboradores importados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro no upload:", err);
      setError(err.message || "Erro ao processar a planilha. Verifique o formato.");
      toast.error("Erro na importação");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <FileSpreadsheet size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">Importar Planilha</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 font-medium">
            Carregue sua planilha Excel (.xlsx ou .csv) para cadastrar múltiplos colaboradores de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div 
            className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer relative"
            onClick={() => document.getElementById('excel-upload')?.click()}
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
              id="excel-upload" 
              type="file" 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100/50">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} /> Dicas para a Planilha
            </h4>
            <ul className="text-xs text-blue-600/80 space-y-2.5 font-bold">
              <li className="flex items-center gap-2">• Ordem: Nº, MATRÍCULA, CC, NOME, FUNÇÃO, ADMISSÃO, TELEFONE, CPF</li>
              <li className="flex items-center gap-2">• O campo "NOME" é obrigatório</li>
              <li className="flex items-center gap-2">• Formato de data: AAAA-MM-DD</li>
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
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
