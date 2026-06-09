import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "../pages/Dashboard";
import AppLayout from "../components/layout/AppLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | SAAS Almoxarifado" },
      { name: "description", content: "Sistema de controle de almoxarifado inteligente." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}