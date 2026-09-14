import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cancelDay, closeDay, reminderPreview, updateReservation } from "@/lib/lunch/api";
import { formatMoney } from "@/lib/utils";
import type { AdminBoard, AdminReservation, DeliveryStatus, PaymentStatus } from "@/lib/lunch/types";

export function MoneyStrip({ day, phase }: { day: NonNullable<AdminBoard["day"]>; phase: AdminBoard["phase"] }) {
  const t = day.totals;
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-ink">Dinero</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {phase === "leftover" ? "Sobrantes" : phase === "early" ? "Anticipadas" : phase}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Cobrados" value={formatMoney(t.collectedCents)} />
        <Stat label="Pendientes" value={formatMoney(t.pendingCents)} />
        <Stat label="Deudas" value={formatMoney(t.debtCents)} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {day.reserved} reservados · {day.remaining} libres · {t.platesDelivered} entregados
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-raised px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-xl tabular-nums text-ink">{value}</p>
    </div>
  );
}

export function ReservationList({ board, onRefresh }: { board: AdminBoard; onRefresh: () => void }) {
  const rows = board.day?.reservations ?? [];
  const debts = rows.filter((r) => r.paymentStatus === "debt");
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl text-ink">Reservas</h2>
      {rows.length === 0 && <p className="text-sm text-muted">Nadie ha reservado todavía.</p>}
      {debts.length > 0 && (
        <div className="rounded-md border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-ink">
          Deudas de hoy: {debts.map((d) => d.name).join(", ")}. El detalle está en la pestaña Deudas.
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <ReservationCard key={row.id} row={row} onRefresh={onRefresh} />
        ))}
      </ul>
    </section>
  );
}

function ReservationCard({ row, onRefresh }: { row: AdminReservation; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  async function patch(partial: { paymentStatus?: PaymentStatus; deliveryStatus?: DeliveryStatus }) {
    setBusy(true);
    try {
      await updateReservation({ data: { id: row.id, ...partial } });
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }
  const payLabel: Record<PaymentStatus, string> = {
    pending: "Pendiente",
    cash: "Efectivo",
    online: "En línea",
    debt: "Deuda",
    none: "Sin cobro",
  };
  const delLabel: Record<DeliveryStatus, string> = {
    reserved: "Reservado",
    delivered: "Entregado",
    noshow: "No se presentó",
    cancelled: "Cancelado",
  };
  return (
    <li className="rounded-lg border border-line bg-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-ink">{row.name}</p>
          <p className="text-sm tabular-nums text-muted">{row.phoneDisplay}</p>
        </div>
        <p className="font-display text-xl tabular-nums text-ink">{row.quantity}</p>
      </div>
      <p className="mt-1 text-xs text-muted">
        {row.timeLabel} · {payLabel[row.paymentStatus] ?? row.paymentStatus} · {delLabel[row.deliveryStatus]}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="leaf" disabled={busy} onClick={() => void patch({ deliveryStatus: "delivered", paymentStatus: "cash" })}>
          Ya llegué · cash
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ paymentStatus: "online", deliveryStatus: "delivered" })}>
          Pagó en línea
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ paymentStatus: "debt" })}>
          Deuda
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void patch({ deliveryStatus: "noshow", paymentStatus: "none" })}>
          No se presentó
        </Button>
      </div>
    </li>
  );
}

export function DayActions({ onRefresh }: { onRefresh: () => void }) {
  const [message, setMessage] = useState("Hoy no voy. Tu reserva queda cancelada.");
  const [busy, setBusy] = useState(false);
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="font-display text-2xl text-ink">Cerrar o cancelar</h2>
      <Label htmlFor="cancel-msg">Aviso si cancelas</Label>
      <textarea
        id="cancel-msg"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-line bg-raised px-4 py-3 text-base text-ink outline-none"
      />
      <Button
        variant="danger"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm("¿Cancelar el día y avisar en la home?")) return;
          setBusy(true);
          try {
            const result = await cancelDay({ data: { message } });
            toast.success(`Día cancelado. Aviso visible. SMS a ${result.wouldNotify} personas queda pendiente de Twilio.`);
            onRefresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo cancelar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Hoy no voy
      </Button>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await closeDay();
            toast.success("Día cerrado. Resumen guardado en historial.");
            onRefresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo cerrar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Cerrar el día
      </Button>
      <Button
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const data = await reminderPreview();
            toast.message(data.message || "Nadie para recordar", {
              description:
                data.recipients.length === 0
                  ? "Sin reservas activas."
                  : `${data.recipients.length} SMS de demo (Twilio pendiente): ${data.recipients.map((r) => r.name).join(", ")}`,
            });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo armar el aviso.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Probar recordatorio de mañana
      </Button>
    </section>
  );
}
