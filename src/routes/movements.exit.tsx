import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpFromLine } from "lucide-react";
import { ExitWizard } from "../features/movements/components/ExitWizard";

export const Route = createFileRoute("/movements/exit")({
  head: () => ({
    meta: [{ title: "Saída de Material | SAAS Almoxarifado" }],
  }),
  component: ExitPage,
});

function ExitPage() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link
          to="/movements"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <ArrowUpFromLine size={12} /> Saída de Material
        </span>
      </div>
      <ExitWizard />
    </div>
  );
}
