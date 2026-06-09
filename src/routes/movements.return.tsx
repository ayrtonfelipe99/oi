import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MovementForm } from "../features/movements/components/MovementForm";

export const Route = createFileRoute("/movements/return")({
  head: () => ({
    meta: [{ title: "Devolução de Material | SAAS Almoxarifado" }],
  }),
  component: ReturnPage,
});

function ReturnPage() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link
          to="/movements"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Devolução de Material
        </span>
      </div>
      <MovementForm kind="epi" type="return" embedded />
    </div>
  );
}
