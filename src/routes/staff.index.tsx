import { createFileRoute } from "@tanstack/react-router";
import Staff from "../pages/Staff";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [{ title: "Equipe | SAAS Almoxarifado" }],
  }),
  component: Staff,
});
