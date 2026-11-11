import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type AppRole, ROLE_LABEL } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Trash2, Ban, LockOpen, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Kelola Pengguna" }] }),
  component: AdminUsersPage,
});

interface UserWithRole {
  id: string;
  full_name: string;
  email: string | null;
  role: AppRole | null;
}

type Filter = "all" | "admin" | "petugas" | "warga" | "blocked";

function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (pErr) {
      toast.error(pErr.message);
      setLoading(false);
      return;
    }

    const { data: roles, error: rErr } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rErr) {
      toast.error(rErr.message);
      setLoading(false);
      return;
    }
    const combined: UserWithRole[] = profiles.map((p) => {
      const userRole = roles.find((r) => r.user_id === p.id);
      return {
        id: p.id,
        full_name: p.full_name,
        email: null,
        role: (userRole?.role as AppRole) ?? null,
      };
    });
    setUsers(combined);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: AppRole) => {
    // Hapus semua role lama milik user ini untuk menghindari bentrok duplicate key
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Masukkan role baru
    const { error: err } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (err) {
      toast.error(err.message);
    } else {
      toast.success("Role berhasil diperbarui");
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
  };

  const deleteUser = async (userId: string) => {
    const { error: pErr } = await supabase.from("profiles").delete().eq("id", userId);

    if (pErr) {
      console.error("Gagal hapus profile:", pErr);
      toast.error(`ERROR DB: ${pErr.message} (Code: ${pErr.code})`);
    } else {
      toast.success("Pengguna berhasil dihapus");
      setUsers(users.filter((u) => u.id !== userId));
      fetchUsers();
    }
  };

  const toggleBlock = async (userId: string, currentRole: AppRole | null) => {
    if (currentRole) {
      // Block = delete role
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (error) toast.error(error.message);
      else {
        toast.success("Pengguna berhasil diblokir");
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: null } : u)));
      }
    } else {
      // Unblock = set to warga
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "warga" });
      if (error) toast.error(error.message);
      else {
        toast.success("Blokir dibuka, peran diset ke Warga");
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: "warga" } : u)));
      }
    }
  };

  const count = (f: Filter) =>
    f === "all" ? users.length
      : f === "blocked" ? users.filter((u) => u.role === null).length
      : users.filter((u) => u.role === f).length;

  const TABS: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "admin", label: "Admin" },
    { key: "petugas", label: "Petugas" },
    { key: "warga", label: "Warga" },
    { key: "blocked", label: "Terblokir" },
  ];

  const visible = users
    .filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()))
    .filter((u) =>
      filter === "all" ? true : filter === "blocked" ? u.role === null : u.role === filter
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 px-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-forest md:text-4xl dark:text-foreground">
            Kelola Pengguna
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Atur peran, blokir akses, dan hapus akun pengguna aplikasi AURA di seluruh Tangerang Selatan.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama pengguna…"
            className="pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter tab */}
      <div className="flex flex-wrap gap-2 px-2">
        {TABS.map((t) => {
          const active = filter === t.key;
          const isBlocked = t.key === "blocked";
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                active
                  ? "bg-forest text-white"
                  : isBlocked
                    ? "bg-card text-destructive hover:bg-destructive/10"
                    : "bg-card text-forest hover:bg-sage dark:text-foreground"
              }`}
            >
              {t.label}
              <span className={`text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>{count(t.key)}</span>
            </button>
          );
        })}
      </div>

      {/* Tabel */}
      <div className="rounded-[32px] bg-card/70 p-3 shadow-soft md:p-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-forest" />
          </div>
        ) : (
          <UserTable users={visible} onUpdateRole={updateRole} onToggleBlock={toggleBlock} onDelete={deleteUser} />
        )}
        {!loading && (
          <p className="px-3 pb-2 pt-4 text-xs text-muted-foreground">
            Menampilkan {visible.length} dari {users.length} pengguna
          </p>
        )}
      </div>
    </div>
  );
}

function UserTable({
  users,
  onUpdateRole,
  onToggleBlock,
  onDelete,
}: {
  users: UserWithRole[];
  onUpdateRole: (id: string, role: AppRole) => void;
  onToggleBlock: (id: string, currentRole: AppRole | null) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="bg-sage-soft text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="rounded-l-full px-5 py-3.5 font-bold">Pengguna</th>
            <th className="px-5 py-3.5 font-bold">Peran</th>
            <th className="px-5 py-3.5 font-bold">Ubah Peran</th>
            <th className="rounded-r-full px-5 py-3.5 text-right font-bold">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center italic text-muted-foreground">
                Tidak ada pengguna dalam daftar ini.
              </td>
            </tr>
          ) : (
            users.map((u) => {
              const blocked = u.role === null;
              return (
                <tr key={u.id} className={blocked ? "opacity-60" : ""}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-sage font-bold text-forest">
                          {u.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-forest dark:text-foreground">{u.full_name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        blocked ? "bg-destructive/10 text-destructive" : "bg-sage text-forest"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${blocked ? "bg-destructive" : "bg-warning"}`} />
                      {blocked ? "Terblokir" : ROLE_LABEL[u.role!]}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <Select
                      value={u.role || "blocked"}
                      disabled={blocked}
                      onValueChange={(v) => {
                        if (v === "blocked") onToggleBlock(u.id, u.role);
                        else onUpdateRole(u.id, v as AppRole);
                      }}
                    >
                      <SelectTrigger className="h-10 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABEL).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                        <SelectItem value="blocked" className="font-medium text-destructive">Blokir Akses</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onToggleBlock(u.id, u.role)}
                        title={blocked ? "Buka Blokir" : "Blokir Pengguna"}
                        aria-label={blocked ? "Buka Blokir" : "Blokir Pengguna"}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                          blocked
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "bg-sage text-forest hover:bg-sage/70"
                        }`}
                      >
                        {blocked ? <LockOpen className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            title="Hapus Pengguna"
                            aria-label="Hapus Pengguna"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-sm rounded-[32px] p-8 text-center">
                          <AlertDialogHeader className="items-center space-y-3 text-center sm:text-center">
                            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-white">
                                <AlertTriangle className="h-6 w-6" />
                              </span>
                            </span>
                            <AlertDialogTitle className="text-2xl font-extrabold text-forest">Hapus Pengguna?</AlertDialogTitle>
                            <AlertDialogDescription className="text-center">
                              Data profil <strong>{u.full_name}</strong> akan dihapus. Penghapusan bersifat permanen dan tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-2 grid grid-cols-2 gap-3 sm:space-x-0">
                            <AlertDialogCancel className="mt-0 h-12 rounded-full border-[1.5px] border-forest font-bold text-forest">
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(u.id)}
                              className="h-12 rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
                            >
                              Ya, Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}