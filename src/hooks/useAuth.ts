import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
 
type AppRole = "admin" | "operador" | "programador";

type AuthContextValue = {
  user: any;
  profile: Profile | null;
  isAdmin: boolean;
  isProgramador: boolean;
  hasAccess: boolean;
  roles: AppRole[];
  loading: boolean;
  error: string | null;
  retry: (source?: string) => Promise<void>;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProgramador, setIsProgramador] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshSourceRef = useRef("initial_load");

  const refreshAuth = useCallback(async (source = "initial_load") => {
    // Bug fix: guards must run BEFORE setLoading, senão loading fica preso em true
    // quando refreshAuth é chamado antes da sessão estar pronta.
    if (!isReady) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[auth] página atual:", window.location.pathname);
      console.log("[auth] iniciando validação:", source);
    }

    setLoading(true);
    setError(null);

    if (!sessionUser) {
      console.warn("[auth] sem sessão ativa");
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsProgramador(false);
      setRoles([]);
      setLoading(false);
      return;
    }

    const authenticatedUser = sessionUser;
    setUser(authenticatedUser);
    if (import.meta.env.DEV) {
      console.log("[auth] usuário autenticado:", {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
      });
    }

    const [{ data: prof, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", authenticatedUser.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", authenticatedUser.id),
    ]);

    if (import.meta.env.DEV) {
      console.log("[auth] resultado da busca no banco: profiles", {
        data: prof,
        error: profileError,
      });
      console.log("[auth] resultado da busca no banco: user_roles", {
        data: roles,
        error: rolesError,
      });
    }

    if (rolesError) {
      console.error("[auth] erro do Supabase ao buscar papéis:", rolesError);
      setProfile((prof as Profile) ?? null);
      setIsAdmin(false);
      setError("Não foi possível validar as permissões do usuário.");
      setLoading(false);
      return;
    }

    if (profileError) {
      console.error("[auth] erro do Supabase ao buscar perfil:", profileError);
    }

    const roleList = (roles ?? []).map((r: any) => r.role as AppRole);
    setProfile((prof as Profile) ?? null);
    setRoles(roleList);
    setIsAdmin(roleList.includes("admin"));
    setIsProgramador(roleList.includes("programador"));
    setLoading(false);
  }, [isReady, sessionUser]);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("[auth] erro ao restaurar sessão:", error);
        setSessionUser(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setError("Não foi possível restaurar sua sessão.");
        setIsReady(true);
        setLoading(false);
        return;
      }

      refreshSourceRef.current = "restore_session";
      setSessionUser(data.session?.user ?? null);
      setIsReady(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        // Bug fix: filtrar eventos para não re-rodar refreshAuth em TOKEN_REFRESHED
        // (que dispara a cada ~1h e em foco de aba) nem em INITIAL_SESSION (duplica restoreSession).
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
          return;
        }

        if (import.meta.env.DEV) {
          console.log("[auth] evento de autenticação:", event, {
            hasSession: !!session,
            userId: session?.user?.id ?? null,
          });
        }

        refreshSourceRef.current = `auth_change:${event}`;
        setSessionUser(session?.user ?? null);
        setIsReady(true);

        if (!session) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setError(null);
          setLoading(false);
        }
      }
    );

    void restoreSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    // Bug fix: removido refreshAuth do array de deps para evitar dupla execução
    // (refreshAuth muda de identidade toda vez que isReady/sessionUser mudam).
    void refreshAuth(refreshSourceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, sessionUser]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    isAdmin,
    isProgramador,
    hasAccess: isAdmin || isProgramador,
    roles,
    loading: loading || !isReady,
    error,
    retry: refreshAuth,
    isReady,
  }), [error, isAdmin, isProgramador, roles, isReady, loading, profile, refreshAuth, user]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
