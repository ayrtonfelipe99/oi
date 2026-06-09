import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import AppLayout from "../components/layout/AppLayout";
import CadastroFerramentas from "../pages/CadastroFerramentas";

const searchSchema = z.object({
  restock: z.string().optional(),
});

export const Route = createFileRoute("/cadastro-ferramentas")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Cadastro de Ferramentas | SAAS Almoxarifado" }],
  }),
  component: () => (
    <AppLayout>
      <CadastroFerramentas />
    </AppLayout>
  ),
});
