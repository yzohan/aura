import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { 
  Map as MapIcon, 
  Users,
  UserCog,
  MapPin,
  FileText,
  UserCircle,
  Settings,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: MapIcon },
  { to: "/admin/petugas", label: "Kelola Petugas", icon: UserCog },
  { to: "/admin/users", label: "Kelola Pengguna", icon: Users },
  { to: "/admin/roads", label: "Data Jalan", icon: MapPin },
  { to: "/admin/reports", label: "Kelola Laporan", icon: FileText },
  { to: "/admin/profile", label: "Profile", icon: UserCircle },
  { to: "/admin/settings", label: "Settings", icon: Settings },
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
