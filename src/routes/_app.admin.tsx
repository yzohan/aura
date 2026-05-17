import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Map as MapIcon, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Peta GIS", icon: MapIcon },
  { to: "/admin/users", label: "Kelola Pengguna", icon: Users },
];

function AdminLayout() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: "/" });
    }
  }, [role, loading, navigate]);

  return (
    <DashboardShell title="Panel Administrasi" nav={NAV}>
      <Outlet />
    </DashboardShell>
  );
}
