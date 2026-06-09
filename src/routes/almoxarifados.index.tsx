import { createFileRoute } from "@tanstack/react-router";
import Warehouses from "../pages/Warehouses";

export const Route = createFileRoute("/almoxarifados/")({
  head: () => ({
    meta: [
      { title: "Almoxarifados | SAAS Almoxarifado" },
      { name: "description", content: "Gerenciamento de almoxarifados e depósitos." },
    ],
  }),
  component: Warehouses,
});
