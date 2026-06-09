import { supabase } from "@/integrations/supabase/client";
import type {
  CreateBuilderTemplateInput,
  CreateTemplateInput,
  DocumentTemplate,
  DocumentTemplateType,
} from "../types/documentTemplateTypes";

const BUCKET = "document-templates";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function validateXlsxFile(file: File): Promise<void> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xls") && !lower.endsWith(".xlsx")) {
    throw new Error(
      "Arquivos .xls não são suportados. Converta este arquivo para .xlsx antes de enviar.",
    );
  }
  if (!lower.endsWith(".xlsx")) {
    throw new Error("Apenas arquivos .xlsx são aceitos nesta versão.");
  }
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (!(head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04)) {
    throw new Error("Arquivo .xlsx inválido ou corrompido.");
  }
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function listTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from("document_templates" as any)
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentTemplate[];
}

export async function getTemplateById(id: string): Promise<DocumentTemplate> {
  const { data, error } = await supabase
    .from("document_templates" as any)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as DocumentTemplate;
}

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<DocumentTemplate> {
  await validateXlsxFile(input.file);

  const { data: userResp } = await supabase.auth.getUser();
  const userId = userResp.user?.id ?? null;

  const checksum = await sha256Hex(input.file);
  const path = `${input.type}/${crypto.randomUUID()}.xlsx`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.file, {
      contentType: XLSX_MIME,
      upsert: false,
    });
  if (upErr) throw upErr;

  const insert = {
    name: input.name,
    type: input.type,
    source_type: "uploaded_excel",
    description: input.description ?? null,
    version: input.version?.trim() || "1",
    is_active: false,
    mapping_config: {},
    builder_config: {},
    original_file_name: input.file.name,
    file_extension: "xlsx",
    mime_type: XLSX_MIME,
    file_size: input.file.size,
    storage_bucket: BUCKET,
    storage_path: path,
    checksum,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("document_templates" as any)
    .insert(insert as any)
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data as unknown as DocumentTemplate;
}

// ---------- Visual builder ----------

export async function createBuilderTemplate(
  input: CreateBuilderTemplateInput,
): Promise<DocumentTemplate> {
  if (!input.name.trim()) throw new Error("Informe o nome do modelo.");

  const { data: userResp } = await supabase.auth.getUser();
  const userId = userResp.user?.id ?? null;

  const insert = {
    name: input.name.trim(),
    type: input.type,
    source_type: "visual_builder",
    description: input.description ?? null,
    version: input.version?.trim() || "1",
    is_active: false,
    mapping_config: {},
    builder_config: input.builder_config ?? {},
    // Storage fields are not used for visual-builder templates; keep schema satisfied.
    original_file_name: `${input.name.trim()}.builder.json`,
    file_extension: "json",
    mime_type: "application/json",
    file_size: 0,
    storage_bucket: BUCKET,
    storage_path: `builder/${crypto.randomUUID()}.json`,
    checksum: null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("document_templates" as any)
    .insert(insert as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DocumentTemplate;
}

export async function updateBuilderConfig(
  id: string,
  builder_config: Record<string, unknown>,
  patch?: { name?: string; description?: string; version?: string },
): Promise<void> {
  const update: Record<string, unknown> = { builder_config };
  if (patch?.name !== undefined) update.name = patch.name.trim();
  if (patch?.description !== undefined) update.description = patch.description;
  if (patch?.version !== undefined) update.version = patch.version.trim() || "1";
  const { error } = await supabase
    .from("document_templates" as any)
    .update(update as any)
    .eq("id", id);
  if (error) throw error;
}

export async function setTemplateActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("document_templates" as any)
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("document_templates" as any)
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function getDownloadUrl(template: DocumentTemplate): Promise<string> {
  const { data, error } = await supabase.storage
    .from(template.storage_bucket)
    .createSignedUrl(template.storage_path, 60, {
      download: template.original_file_name,
    });
  if (error) throw error;
  return data.signedUrl;
}

export async function countActiveByType(type: DocumentTemplateType): Promise<number> {
  const { count, error } = await supabase
    .from("document_templates" as any)
    .select("id", { count: "exact", head: true })
    .eq("type", type)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}
