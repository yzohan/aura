import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Wrench, UserCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_app/petugas")({
  component: PetugasLayout,
});

const NAV = [
  { to: "/petugas", label: "Work Order", icon: Wrench },
  { to: "/petugas/profile", label: "Profil Saya", icon: UserCircle },
];

function PetugasLayout() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && role !== "petugas") {
      navigate({ to: "/" });
    }
  }, [role, loading, navigate]);

  return (
    <DashboardShell title="Dashboard Petugas Lapangan" nav={NAV}>
      <Outlet />
    </DashboardShell>
  );
}
