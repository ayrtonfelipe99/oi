import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowUpFromLine, ArrowDownToLine, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Movements = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === 's') navigate({ to: '/movements/exit' });
      if (k === 'd') navigate({ to: '/movements/return' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const time = now ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  const operatorName = profile?.full_name || '';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_#f8fafc_0%,_#eef2f7_70%)] px-2 py-4 sm:px-[5%] sm:py-[6%]">

      {/* Buttons */}
      <div className="w-full max-w-[760px] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <ActionTile
          to="/movements/exit"
          label="Saída"
          subtitle="Registrar retirada"
          shortcut="S"
          icon={<ArrowUpFromLine className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.8} />}
          gradient="from-indigo-600 via-blue-600 to-blue-500"
          glow="shadow-[0_20px_60px_-15px_rgba(79,70,229,0.45)]"
          delay="100"
        />
        <ActionTile
          to="/movements/return"
          label="Devolução"
          subtitle="Receber devolvido"
          shortcut="D"
          icon={<ArrowDownToLine className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.8} />}
          gradient="from-emerald-600 via-emerald-500 to-teal-500"
          glow="shadow-[0_20px_60px_-15px_rgba(16,185,129,0.45)]"
          delay="180"
        />
      </div>

      {/* Footer */}
      <footer className="mt-6 sm:absolute sm:bottom-4 sm:left-0 sm:right-0 sm:mt-0 flex items-center justify-center gap-2 text-[0.7rem] text-slate-400 font-light tracking-wide">
        <Clock className="w-3 h-3" strokeWidth={1.6} />
        <span className="tabular-nums">{time}</span>
        {operatorName && (
          <>
            <span className="opacity-40">·</span>
            <span className="truncate max-w-[40vw]">{operatorName}</span>
          </>
        )}
      </footer>
    </div>
  );
};

export default Movements;

const ActionTile = ({
  to,
  label,
  subtitle,
  shortcut,
  icon,
  gradient,
  glow,
  delay,
}: {
  to: string;
  label: string;
  subtitle: string;
  shortcut: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  delay: string;
}) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to })}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} text-white aspect-[16/10] sm:aspect-[2/1] flex flex-col items-center justify-center gap-2 sm:gap-3 ${glow} ring-1 ring-inset ring-white/20 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 cursor-pointer`}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      {/* Shimmer on hover */}
      <div className="absolute -inset-y-2 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-0 group-hover:translate-x-[400%] transition-transform duration-1000 ease-out pointer-events-none" />

      {/* Icon framed */}
      <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-inset ring-white/25 group-hover:scale-105 group-hover:bg-white/20 transition-all duration-300">
        {icon}
      </div>

      <div className="relative flex flex-col items-center gap-1">
        <span className="text-xl sm:text-2xl font-semibold tracking-tight">{label}</span>
        <span className="text-[0.65rem] sm:text-xs font-light tracking-[0.2em] uppercase text-white/70">
          {subtitle}
        </span>
      </div>

      {/* Shortcut */}
      <kbd className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-white/15 ring-1 ring-inset ring-white/20 text-[0.65rem] font-medium text-white/80 backdrop-blur-sm">
        {shortcut}
      </kbd>
    </button>
  );
};
