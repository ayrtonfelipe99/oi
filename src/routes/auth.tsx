import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar | SAAS Almoxarifado" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, hasAccess, isReady, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady || loading) return;

    if (import.meta.env.DEV) {
      console.log("[auth-page] página atual:", window.location.pathname);
      console.log("[auth-page] usuário autenticado:", user ?? null);
    }

    if (user && hasAccess) {
      console.warn("[auth-page] motivo do redirecionamento: sessão válida");
      navigate({ to: "/", replace: true });
    }
  }, [hasAccess, isReady, loading, navigate, user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (import.meta.env.DEV) console.log("[auth-page] tentativa de login", { email });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      console.error("[auth-page] erro retornado pelo Supabase no login:", error);
      toast.error(error?.message ?? "Falha ao entrar");
      setSubmitting(false);
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[auth-page] usuário autenticado:", {
        id: data.user.id,
        email: data.user.email,
      });
    }

    // Verify admin role
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    if (import.meta.env.DEV) {
      console.log("[auth-page] resultado da busca no banco: user_roles", {
        data: roles,
        error: rolesError,
      });
    }

    if (rolesError) {
      console.error("[auth-page] erro retornado pelo Supabase ao verificar permissões:", rolesError);
      toast.error("Não foi possível validar as permissões do usuário.");
      setSubmitting(false);
      return;
    }

    const roleList = (roles ?? []).map((r: any) => r.role);
    const hasAccess = roleList.includes("admin") || roleList.includes("programador");
    if (!hasAccess) {
      console.warn("[auth-page] motivo do redirecionamento: usuário sem papel admin/programador");
      await supabase.auth.signOut();
      toast.error("Acesso restrito a administradores e programadores.");
      setSubmitting(false);
      return;
    }

    toast.success("Bem-vindo!");
    navigate({ to: "/", replace: true });
  };

  if (!isReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm font-medium">Verificando sessão…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-blue-600 text-white p-3 rounded-2xl w-fit">
            <ShieldCheck size={28} />
          </div>
          <CardTitle className="text-2xl">SAAS Almoxarifado</CardTitle>
          <CardDescription>Acesso restrito a administradores</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
