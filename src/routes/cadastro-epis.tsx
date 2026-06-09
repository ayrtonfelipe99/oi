import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import AppLayout from "../components/layout/AppLayout";
import CadastroEPIs from "../pages/CadastroEPIs";

const searchSchema = z.object({
  restock: z.string().optional(),
});

export const Route = createFileRoute("/cadastro-epis")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Cadastro de EPIs | SAAS Almoxarifado" }],
  }),
  component: () => (
    <AppLayout>
      <CadastroEPIs />
    </AppLayout>
  ),
});
