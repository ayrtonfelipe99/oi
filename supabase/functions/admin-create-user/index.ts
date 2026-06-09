// Edge function: admin-create-user
// Cria um usuário (auth.users), insere papel em user_roles e perfil em profiles.
// Apenas chamadores com papel 'admin' ou 'programador' podem usar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "operador" | "programador";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
    ?? Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Não autenticado" }, 401);
  }

  // 1) Validate caller and check role
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "Sessão inválida" }, 401);
  }
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerRoles, error: rolesErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId);
  if (rolesErr) return json({ error: "Falha ao validar permissões" }, 500);

  const allowed = (callerRoles ?? []).some(
    (r: { role: string }) => r.role === "admin" || r.role === "programador",
  );
  if (!allowed) {
    return json({ error: "Apenas admins e programadores podem criar usuários" }, 403);
  }

  // 2) Parse + validate body
  let body: { email?: string; password?: string; full_name?: string; role?: Role };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const full_name = (body.full_name ?? "").trim();
  const role = body.role as Role;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "E-mail inválido" }, 400);
  }
  if (password.length < 8 || password.length > 128) {
    return json({ error: "A senha deve ter entre 8 e 128 caracteres" }, 400);
  }
  if (full_name.length > 200) {
    return json({ error: "Nome muito longo" }, 400);
  }
  if (role !== "admin" && role !== "operador" && role !== "programador") {
    return json({ error: "Papel inválido" }, 400);
  }

  // 3) Create auth user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || email },
  });
  if (createErr || !created?.user) {
    return json({ error: createErr?.message ?? "Falha ao criar usuário" }, 400);
  }
  const newId = created.user.id;

  // 4) Upsert profile
  const { error: profErr } = await admin.from("profiles").upsert(
    { id: newId, email, full_name: full_name || email },
    { onConflict: "id" },
  );
  if (profErr) {
    return json({ error: `Usuário criado, mas falhou ao salvar perfil: ${profErr.message}` }, 500);
  }

  // 5) Assign role (single role per user)
  await admin.from("user_roles").delete().eq("user_id", newId);
  const { error: roleErr } = await admin.from("user_roles").insert({
    user_id: newId,
    role,
  });
  if (roleErr) {
    return json({ error: `Usuário criado, mas falhou ao atribuir papel: ${roleErr.message}` }, 500);
  }

  return json({ ok: true, user: { id: newId, email, full_name, role } }, 200);
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
