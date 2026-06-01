import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type AppRole, ROLE_LABEL } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, UserCog, Trash2, Ban, ShieldCheck, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    const combined: UserWithRole[] = profiles
      .map((p) => {
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
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteUser = async (userId: string) => {
    console.log("Memulai proses hapus untuk ID:", userId);
    
    const { error: pErr } = await supabase.from("profiles").delete().eq("id", userId);
    
    if (pErr) {
      console.error("Gagal hapus profile:", pErr);
      toast.error(`ERROR DB: ${pErr.message} (Code: ${pErr.code})`);
    } else {
      console.log("Berhasil hapus dari profiles!");
      toast.success("User berhasil dihapus PERMANEN dari database!");
      setUsers(users.filter(u => u.id !== userId));
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
        setUsers(users.map(u => u.id === userId ? { ...u, role: null } : u));
      }
    } else {
      // Unblock = set to warga
      // Hapus role lama dulu sebelum insert untuk menghindari bentrok duplicate key
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "warga" });
      if (error) toast.error(error.message);
      else {
        toast.success("Blokir dibuka, peran diset ke Warga");
        setUsers(users.map(u => u.id === userId ? { ...u, role: "warga" } : u));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h2>
          <p className="text-muted-foreground text-sm">
            Atur peran akses untuk warga, petugas lapangan, dan admin dinas.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Cari nama pengguna..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px] mb-4">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="petugas">Petugas</TabsTrigger>
          <TabsTrigger value="warga">Warga</TabsTrigger>
          <TabsTrigger value="blocked">Terblokir</TabsTrigger>
        </TabsList>

        <Card className="overflow-hidden shadow-soft border-none bg-transparent">
          {loading ? (
            <Card className="flex h-64 items-center justify-center border border-border">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : (
            <>
              <TabsContent value="all">
                <UserTable users={filteredUsers} onUpdateRole={updateRole} onToggleBlock={toggleBlock} onDelete={deleteUser} />
              </TabsContent>
              <TabsContent value="admin">
                <UserTable users={filteredUsers.filter(u => u.role === "admin")} onUpdateRole={updateRole} onToggleBlock={toggleBlock} onDelete={deleteUser} />
              </TabsContent>
              <TabsContent value="petugas">
                <UserTable users={filteredUsers.filter(u => u.role === "petugas")} onUpdateRole={updateRole} onToggleBlock={toggleBlock} onDelete={deleteUser} />
              </TabsContent>
              <TabsContent value="warga">
                <UserTable users={filteredUsers.filter(u => u.role === "warga")} onUpdateRole={updateRole} onToggleBlock={toggleBlock} onDelete={deleteUser} />
              </TabsContent>
              <TabsContent value="blocked">
                <UserTable users={filteredUsers.filter(u => u.role === null)} onUpdateRole={updateRole} onToggleBlock={toggleBlock} onDelete={deleteUser} />
              </TabsContent>
            </>
          )}
        </Card>
      </Tabs>
    </div>
  );
}

function UserTable({ 
  users, 
  onUpdateRole, 
  onToggleBlock, 
  onDelete 
}: { 
  users: UserWithRole[], 
  onUpdateRole: (id: string, role: AppRole) => void,
  onToggleBlock: (id: string, currentRole: AppRole | null) => void,
  onDelete: (id: string) => void
}) {
  return (
    <Card className="overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/30 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold">Pengguna</th>
              <th className="px-6 py-4 font-semibold">Peran</th>
              <th className="px-6 py-4 font-semibold">Ubah Peran</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic bg-background/50">
                  Tidak ada pengguna dalam daftar ini.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {u.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.role ? (
                      <Badge variant="secondary" className="font-normal">
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="font-normal">
                        Diblokir
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={u.role || "blocked"}
                      onValueChange={(v) => {
                        if (v === "blocked") onToggleBlock(u.id, u.role);
                        else onUpdateRole(u.id, v as AppRole);
                      }}
                    >
                      <SelectTrigger className="h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blocked" className="text-destructive font-medium">Blokir Akses</SelectItem>
                        {Object.entries(ROLE_LABEL).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${u.role ? 'text-muted-foreground' : 'text-success hover:text-success'}`}
                        onClick={() => onToggleBlock(u.id, u.role)}
                        title={u.role ? "Blokir Pengguna" : "Buka Blokir"}
                      >
                        {u.role ? <Ban className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Hapus Data Profil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <div className="flex items-center gap-3 text-destructive">
                              <AlertTriangle className="h-6 w-6" />
                              <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>
                              Tindakan ini akan menghapus data profil <strong>{u.full_name}</strong> secara permanen. 
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDelete(u.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Ya, Hapus Permanen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
