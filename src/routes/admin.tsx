import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/admin/admin-panel";
import { getAdminBoard } from "@/lib/lunch/api";

export const Route = createFileRoute("/admin")({
  loader: () => getAdminBoard(),
  component: AdminPage,
});

function AdminPage() {
  const initial = Route.useLoaderData();
  return <AdminPanel initial={initial} />;
}
