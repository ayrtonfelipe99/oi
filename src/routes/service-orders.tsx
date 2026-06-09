import { createFileRoute } from "@tanstack/react-router";
import ServiceOrders from "../pages/ServiceOrders";
import AppLayout from "../components/layout/AppLayout";

export const Route = createFileRoute("/service-orders")({
  head: () => ({
    meta: [{ title: "Ordens de Serviço | SAAS Almoxarifado" }],
  }),
  component: () => (
    <AppLayout>
      <ServiceOrders />
    </AppLayout>
  ),
});
