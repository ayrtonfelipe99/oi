export type DocumentTemplateType = "epi" | "tool" | "other";
export type DocumentTemplateSource = "uploaded_excel" | "visual_builder";

export const DOCUMENT_TEMPLATE_TYPE_LABEL: Record<DocumentTemplateType, string> = {
  epi: "Ficha de EPI",
  tool: "Ficha de Ferramentas",
  other: "Personalizado",
};

export const DOCUMENT_TEMPLATE_SOURCE_LABEL: Record<DocumentTemplateSource, string> = {
  uploaded_excel: "Excel enviado",
  visual_builder: "Criado no sistema",
};

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType;
  source_type: DocumentTemplateSource;
  description: string | null;
  version: string;
  is_active: boolean;
  mapping_config: Record<string, unknown>;
  builder_config: Record<string, unknown>;
  original_file_name: string;
  file_extension: string;
  mime_type: string;
  file_size: number;
  storage_bucket: string;
  storage_path: string;
  checksum: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTemplateInput {
  name: string;
  type: DocumentTemplateType;
  description?: string;
  version?: string;
  file: File;
}

export interface CreateBuilderTemplateInput {
  name: string;
  type: DocumentTemplateType;
  description?: string;
  version?: string;
  builder_config: Record<string, unknown>;
}
