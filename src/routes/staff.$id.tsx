import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffProfile } from "@/components/staff/StaffProfile";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/staff/$id")({
  head: () => ({
    meta: [{ title: "Perfil do Colaborador | SAAS Almoxarifado" }],
  }),
  component: StaffProfilePage,
});

function StaffProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <p className="text-xl font-bold text-slate-500">Colaborador não encontrado.</p>
        <Button onClick={() => navigate({ to: "/staff" })}>Voltar para a lista</Button>
      </div>
    );
  }

  return (
    <div className="px-0 py-3 sm:py-4 lg:py-6 w-full">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/staff" })}
          className="rounded-full hover:bg-slate-100 font-bold gap-2"
        >
          <ArrowLeft size={18} /> Voltar
        </Button>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Ficha do Colaborador</h1>
      </div>
      <StaffProfile
        staff={staff}
        onClose={() => navigate({ to: "/staff" })}
      />
    </div>
  );
}

