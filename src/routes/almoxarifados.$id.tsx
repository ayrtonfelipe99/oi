import { createFileRoute } from "@tanstack/react-router";
import WarehouseDetails from "../pages/WarehouseDetails";

export const Route = createFileRoute("/almoxarifados/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do Almoxarifado | SAAS Almoxarifado" },
    ],
  }),
  component: WarehouseDetails,
});