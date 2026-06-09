import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, UserCog, UserPlus, Code2 } from "lucide-react";
import { toast } from "sonner";

type AppRole = "admin" | "operador" | "programador";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
};

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Usuários | SAAS Almoxarifado" }] }),
  component: UsersPage,
});

function UsersPage() {
  const navigate = useNavigate();
  const { user, isReady, loading } = useAuth();
  const queryClient = useQueryClient();

  // Fetch the caller's own roles to detect admin / programador.
  const { data: myRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.role as AppRole);
    },
  });

  const isAdmin = (myRoles ?? []).includes("admin");
  const isProgramador = (myRoles ?? []).includes("programador");
  const canManage = isAdmin || isProgramador;

  useEffect(() => {
    if (!isReady || loading || rolesLoading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (!canManage) {
      toast.error("Acesso restrito a administradores e programadores.");
      navigate({ to: "/", replace: true });
    }
  }, [user, canManage, isReady, loading, rolesLoading, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    enabled: !!user && canManage,
    queryFn: async (): Promise<UserRow[]> => {
      const [{ data: profiles, error: profErr }, { data: roles, error: rolesErr }] =
        await Promise.all([
          supabase.from("profiles").select("id, email, full_name"),
          supabase.from("user_roles").select("user_id, role"),
        ]);
      if (profErr) throw profErr;
      if (rolesErr) throw rolesErr;
      const roleByUser = new Map<string, AppRole>();
      (roles ?? []).forEach((r: any) => roleByUser.set(r.user_id, r.role as AppRole));
      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: roleByUser.get(p.id) ?? null,
      }));
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Papel atualizado");
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar papel"),
  });

  // ---- Create user form ----
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "operador" as AppRole,
  });

  // Programadores têm todas as permissões (incluindo criar admin).
  // Admins criam admin/operador.
  const availableRoles: AppRole[] = isProgramador
    ? ["admin", "programador", "operador"]
    : ["admin", "operador"];

  const createUserMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: payload,
      });
      if (error) throw new Error(error.message ?? "Falha ao criar usuário");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário criado");
      setForm({ full_name: "", email: "", password: "", role: availableRoles[0] });
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao criar usuário"),
  });

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    if (form.password.length < 8) {
      toast.error("A senha precisa de pelo menos 8 caracteres");
      return;
    }
    createUserMutation.mutate(form);
  };

  const rows = useMemo(() => data ?? [], [data]);

  if (!isReady || loading || rolesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={18} /> Carregando…
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <header className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 text-white p-2">
            <UserCog size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Usuários e Papéis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Crie usuários e defina o papel: <strong>programador</strong>,{" "}
              <strong>admin</strong> ou <strong>operador</strong>.
            </p>
          </div>
          {isProgramador && (
            <Badge className="ml-auto bg-fuchsia-600 text-white">
              <Code2 size={12} className="mr-1" /> Você é programador
            </Badge>
          )}
        </header>

        {/* Create user form */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <UserPlus size={16} className="text-slate-500" /> Criar novo usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitCreate} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Maria Silva"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="maria@empresa.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Senha (mín. 8 caracteres)</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Papel</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as AppRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r === "programador"
                          ? "Programador"
                          : r === "admin"
                            ? "Admin"
                            : "Operador"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} /> Criando…
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-2" /> Criar usuário
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Users table */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ShieldCheck size={16} className="text-slate-500" />
              {rows.length} usuário{rows.length === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 className="animate-spin mr-2" size={16} /> Carregando…
              </div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                Nenhum perfil cadastrado ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel atual</TableHead>
                    <TableHead className="text-right">Definir papel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-semibold text-slate-800">
                        {u.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-slate-600">{u.email || "—"}</TableCell>
                      <TableCell>
                        {u.role === "programador" ? (
                          <Badge className="bg-fuchsia-600 text-white">programador</Badge>
                        ) : u.role === "admin" ? (
                          <Badge className="bg-slate-900 text-white">admin</Badge>
                        ) : u.role === "operador" ? (
                          <Badge variant="secondary">operador</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-300">
                            sem papel
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={u.role ?? undefined}
                          onValueChange={(value) =>
                            setRoleMutation.mutate({ userId: u.id, role: value as AppRole })
                          }
                          disabled={setRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[180px] ml-auto">
                            <SelectValue placeholder="Selecionar…" />
                          </SelectTrigger>
                          <SelectContent>
                            {isProgramador && (
                              <SelectItem value="programador">Programador</SelectItem>
                            )}
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="operador">Operador</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
