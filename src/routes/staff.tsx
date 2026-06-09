import { createFileRoute, Outlet } from "@tanstack/react-router";
import AppLayout from "../components/layout/AppLayout";

export const Route = createFileRoute("/staff")({
  component: StaffLayout,
});

function StaffLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
