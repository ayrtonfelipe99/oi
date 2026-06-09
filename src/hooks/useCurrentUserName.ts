import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the current authenticated user's display name (full_name from profile,
 * falling back to email or 'Sistema'). Used to auto-fill "Responsável pelo cadastro"
 * fields automatically without asking the user.
 */
export function useCurrentUserName() {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        if (!cancelled) setName('Sistema');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const resolved =
        (profile?.full_name && String(profile.full_name).trim()) ||
        (profile?.email && String(profile.email).trim()) ||
        user.email ||
        'Sistema';

      if (!cancelled) setName(resolved);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return name;
}
