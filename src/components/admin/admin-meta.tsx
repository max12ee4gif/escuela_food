import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveConfig } from "@/lib/lunch/api";
import { formatMoney } from "@/lib/utils";
import type { AdminBoard } from "@/lib/lunch/types";

export function HistoryTab({ board }: { board: AdminBoard }) {
  return (
    <section className="flex flex-col gap-3 pb-16">
      <h2 className="font-display text-2xl text-ink">Días anteriores</h2>
      {board.history.length === 0 && <p className="text-sm text-muted">Todavía no hay historial.</p>}
      <ul className="flex flex-col">
        {board.history.map((h) => (
          <li key={h.id} className="flex items-baseline justify-between gap-3 border-b border-line py-3">
            <div>
              <p className="font-medium capitalize text-ink">{h.weekdayLabel} · {h.dishName}</p>
              <p className="text-xs text-muted">{h.sold} vendidos · {h.leftover} sobraron{h.status === "cancelled" ? " · cancelado" : ""}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-ink">{formatMoney(h.collectedCents)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ConfigTab({ board, onRefresh }: { board: AdminBoard; onRefresh: () => void }) {
  const [maxPerPerson, setMaxPerPerson] = useState(board.maxPerPerson === 2 ? 2 : 3);
  const [capacity, setCapacity] = useState(board.defaultCapacity);
  const [phaseOverride, setPhaseOverride] = useState<"early" | "leftover" | null>(board.phaseOverride);
  const [busy, setBusy] = useState(false);
  return (
    <section className="flex flex-col gap-5 pb-16">
      <h2 className="font-display text-2xl text-ink">Reglas</h2>
      <p className="text-sm text-muted">Precio fijo {formatMoney(board.priceCents)}. Reloj del servidor: {board.now.ymd} {String(board.now.hour).padStart(2, "0")}:{String(board.now.minute).padStart(2, "0")} {board.now.tz}.</p>
      <fieldset>
        <Label>Tope por persona</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[2, 3].map((n) => (
            <button key={n} type="button" onClick={() => setMaxPerPerson(n as 2 | 3)} className={`h-12 rounded-md border font-semibold ${maxPerPerson === n ? "border-ink bg-ink text-raised" : "border-line bg-raised"}`}>{n}</button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="def-cap">Capacidad por defecto</Label>
        <Input id="def-cap" type="number" min={1} max={40} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
      </div>
      <fieldset>
        <Label>Fase (demo)</Label>
        <p className="mb-2 text-xs text-muted">El corte real es a las 8:00 AM hora de Chicago. Esto solo simula la vista.</p>
        <div className="grid grid-cols-3 gap-2">
          {([[null, "Reloj"], ["early", "Antes 8AM"], ["leftover", "Sobrantes"]] as const).map(([value, label]) => (
            <button key={String(value)} type="button" onClick={() => setPhaseOverride(value)} className={`h-12 rounded-md border text-sm font-semibold ${phaseOverride === value ? "border-ink bg-ink text-raised" : "border-line bg-raised"}`}>{label}</button>
          ))}
        </div>
      </fieldset>
      <Button size="lg" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          await saveConfig({ data: { maxPerPerson, capacity, phaseOverride } });
          toast.success("Configuración guardada.");
          onRefresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
        } finally { setBusy(false); }
      }}>Guardar</Button>
      <div className="rounded-lg border border-line bg-raised p-4 text-sm text-muted">
        <p className="font-semibold text-ink">Pendiente para producción</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Twilio: código SMS, recordatorio de la mañana y aviso de “hoy no voy”.</li>
          <li>Stripe: cobro en línea de $10. Hoy solo se marca el estado.</li>
          <li>2FA al celular del vendedor.</li>
        </ul>
      </div>
    </section>
  );
}
