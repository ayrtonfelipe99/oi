import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to realtime changes on key tables to keep the dashboard
 * synchronized with the database without manual refresh.
 */
export const useDashboardRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const tables = ['products', 'transactions', 'service_orders', 'profiles', 'staff', 'warehouses'];

    const channel = supabase
      .channel(`dashboard-sync-${Math.random().toString(36).slice(2)}`);

    tables.forEach((table) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-counts'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-group-stats'] });
          queryClient.invalidateQueries({ queryKey: ['service_orders_list'] });
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
