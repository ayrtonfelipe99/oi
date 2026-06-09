import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/movements/new')({
  beforeLoad: ({ search }: any) => {
    const type = search?.type === 'return' ? 'return' : 'exit';
    throw redirect({ to: type === 'return' ? '/movements/return' : '/movements/exit' });
  },
});
