import { createFileRoute } from "@tanstack/react-router";
import Movements from "../pages/Movements";

export const Route = createFileRoute("/movements/")({
  head: () => ({
    meta: [{ title: "Movimentações | SAAS Almoxarifado" }],
  }),
  component: Movements,
});
