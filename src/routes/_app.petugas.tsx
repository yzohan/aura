import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wrench, Camera, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";

export const Route = createFileRoute("/_app/petugas")({
  head: () => ({ meta: [{ title: "Dashboard Petugas" }] }),
  component: PetugasPage,
});

const NAV = [{ to: "/petugas", label: "Work Order", icon: Wrench }];

interface WorkOrderItem {
  id: string;
  report_id: string;
  notes: string | null;
  proof_photo_url: string | null;
  completed_at: string | null;
  created_at: string;
  report: {
    id: string;
    title: string;
    description: string;
    category: keyof typeof CATEGORY_LABEL;
    status: keyof typeof STATUS_LABEL;
    urgency: keyof typeof URGENCY_LABEL;
    address: string | null;
    latitude: number;
    longitude: number;
  };
}

function PetugasPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<WorkOrderItem[] | null>(null);

  useEffect(() => {
    if (!loading && role && role !== "petugas") navigate({ to: "/" });
  }, [role, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("id, report_id, notes, proof_photo_url, completed_at, created_at, report:reports(id, title, description, category, status, urgency, address, latitude, longitude)")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setOrders((data ?? []) as unknown as WorkOrderItem[]);
    };
    load();
    const channel = supabase
      .channel("petugas-wo")
      .on("postgres_changes", { event: "*", schema: "public", table: "work_orders", filter: `assigned_to=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <DashboardShell title="Dashboard Petugas Lapangan" nav={NAV}>
      <div className="grid gap-4">
        {orders === null && <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-primary" />}
        {orders?.length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground shadow-soft">
            Belum ada work order yang ditugaskan.
          </Card>
        )}
        {orders?.map((wo) => (
          <WorkOrderCard key={wo.id} wo={wo} userId={user!.id} />
        ))}
      </div>
    </DashboardShell>
  );
}

function WorkOrderCard({ wo, userId }: { wo: WorkOrderItem; userId: string }) {
  const r = wo.report;
  const [notes, setNotes] = useState(wo.notes ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const completed = !!wo.completed_at;

  const markDone = async () => {
    setSubmitting(true);
    let proofPath = wo.proof_photo_url;
    if (photo) {
      const ext = photo.name.split(".").pop() ?? "jpg";
      proofPath = `${userId}/wo-${wo.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("reports").upload(proofPath, photo, {
        cacheControl: "3600", upsert: false,
      });
      if (upErr) { setSubmitting(false); toast.error("Upload gagal: " + upErr.message); return; }
    }
    const [{ error: woErr }, { error: rErr }] = await Promise.all([
      supabase.from("work_orders").update({
        notes, proof_photo_url: proofPath, completed_at: new Date().toISOString(),
      }).eq("id", wo.id),
      supabase.from("reports").update({ status: "resolved" }).eq("id", r.id),
    ]);
    setSubmitting(false);
    if (woErr || rErr) { toast.error(woErr?.message ?? rErr?.message ?? "Error"); return; }
    toast.success("Work order ditandai selesai!");
  };

  return (
    <Card className={`p-5 shadow-soft ${completed ? "opacity-75" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            Ditugaskan {formatDistanceToNow(new Date(wo.created_at), { addSuffix: true, locale: idLocale })}
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {CATEGORY_ICON[r.category]} {r.title}
          </h3>
          <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[r.category]}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
          <Badge variant="outline" className={URGENCY_TONE[r.urgency]}>{URGENCY_LABEL[r.urgency]}</Badge>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {r.address && <span><MapPin className="mr-1 inline h-3 w-3" />{r.address}</span>}
        <a
          href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=18/${r.latitude}/${r.longitude}`}
          target="_blank" rel="noreferrer"
          className="text-primary hover:underline"
        >
          Buka di peta ({r.latitude.toFixed(4)}, {r.longitude.toFixed(4)})
        </a>
      </div>

      {!completed ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <Textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan penanganan…" rows={2}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40">
              <Camera className="h-4 w-4" /> {photo ? photo.name : "Foto bukti"}
              <input type="file" accept="image/*" capture="environment" className="sr-only"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            <Button onClick={markDone} disabled={submitting} className="bg-leaf-gradient text-primary-foreground hover:opacity-90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Tandai selesai</>}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
          ✓ Selesai pada {new Date(wo.completed_at!).toLocaleString("id-ID")}
          {wo.notes && <p className="mt-1 text-xs text-muted-foreground">{wo.notes}</p>}
        </div>
      )}
    </Card>
  );
}
