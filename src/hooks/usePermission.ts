import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Carrega o conjunto de permissões do usuário atual, derivado dos seus papéis.
 * Programador sempre tem todas as permissões.
 */
export function useMyPermissions() {
  const { user, roles, isReady } = useAuth();

  return useQuery({
    queryKey: ['my-permissions', user?.id, roles.join(',')],
    enabled: isReady && !!user,
    staleTime: 60_000,
    queryFn: async () => {
      // Programador tem tudo
      if (roles.includes('programador')) {
        return { all: true as const, set: new Set<string>() };
      }
      if (roles.length === 0) {
        return { all: false as const, set: new Set<string>() };
      }
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .in('role', roles);
      if (error) throw error;
      return {
        all: false as const,
        set: new Set((data ?? []).map((r: any) => r.permission as string)),
      };
    },
  });
}

/** Retorna true se o usuário atual pode executar a ação. */
export function usePermission(permission: string): boolean {
  const { data } = useMyPermissions();
  if (!data) return false;
  if (data.all) return true;
  return data.set.has(permission);
}

/** Retorna função pra checar várias permissões sem múltiplos hooks. */
export function usePermissionChecker(): (p: string) => boolean {
  const { data } = useMyPermissions();
  return (p: string) => {
    if (!data) return false;
    if (data.all) return true;
    return data.set.has(p);
  };
}
