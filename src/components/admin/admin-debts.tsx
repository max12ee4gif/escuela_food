import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addExtraDebt, adjustDebt, clearDebt, listDebts } from "@/lib/lunch/api";
import { PRICE_CENTS } from "@/lib/lunch/types";
import { formatMoney } from "@/lib/utils";

export function DebtsTab() {
  const query = useQuery({
    queryKey: ["admin-debts"],
    queryFn: () => listDebts(),
    refetchInterval: 5000,
  });
  const data = query.data;
  const items = data?.items ?? [];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plates, setPlates] = useState(1);
  const [busy, setBusy] = useState(false);

  return (
    <section className="flex flex-col gap-5 pb-16">
      <div>
        <h2 className="font-display text-2xl text-ink">Deudas</h2>
        <p className="text-sm text-muted">
          Aquí solo entra quien quedó a deber. “No se presentó” no cuenta como deuda ni pendiente.
        </p>
      </div>

      <div className="rounded-md bg-raised px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Total deudas</p>
        <p className="mt-1 font-display text-3xl tabular-nums text-ink">{formatMoney(data?.totalCents ?? 0)}</p>
      </div>

      {items.length === 0 && <p className="text-sm text-muted">No hay deudas.</p>}

      <ul className="flex flex-col gap-3">
        {items.map((row) => (
          <li key={row.key} className="rounded-lg border border-line bg-raised p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-ink">{row.name}</p>
                <p className="text-sm tabular-nums text-muted">{row.phoneDisplay}</p>
                <p className="text-xs text-muted">
                  {row.serviceDate ? `${row.serviceDate} · ` : ""}
                  {row.dishName}
                </p>
              </div>
              <p className="font-display text-xl tabular-nums text-ink">{formatMoney(row.owedCents)}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await adjustDebt({
                      data: { reservationId: row.reservationId, extraId: row.extraId, deltaCents: PRICE_CENTS },
                    });
                    toast.success("Se sumaron $10.");
                    void query.refetch();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No se pudo sumar.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                + $10
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await adjustDebt({
                      data: { reservationId: row.reservationId, extraId: row.extraId, deltaCents: -PRICE_CENTS },
                    });
                    toast.success("Se restaron $10.");
                    void query.refetch();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No se pudo restar.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                − $10
              </Button>
              <Button
                size="sm"
                variant="leaf"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await clearDebt({
                      data: { reservationId: row.reservationId, extraId: row.extraId, as: "cash" },
                    });
                    toast.success("Marcado como cobrado.");
                    void query.refetch();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No se pudo cobrar.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Ya pagó
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await clearDebt({
                      data: { reservationId: row.reservationId, extraId: row.extraId, as: "none" },
                    });
                    toast.success("Deuda quitada.");
                    void query.refetch();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No se pudo quitar.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Quitar deuda
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border border-line bg-raised p-3">
        <p className="mb-2 text-sm font-medium text-ink">Agregar deuda</p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="debt-name">Nombre</Label>
            <Input id="debt-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="debt-phone">Teléfono (opcional)</Label>
            <Input id="debt-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="debt-qty">Platos a $10</Label>
            <Input
              id="debt-qty"
              type="number"
              min={1}
              max={20}
              value={plates}
              onChange={(e) => setPlates(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <Button
            variant="outline"
            disabled={busy || name.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              try {
                await addExtraDebt({
                  data: {
                    name: name.trim(),
                    phone,
                    amountCents: plates * PRICE_CENTS,
                    note: `${plates} plato${plates === 1 ? "" : "s"}`,
                  },
                });
                setName("");
                setPhone("");
                setPlates(1);
                toast.success("Deuda agregada.");
                void query.refetch();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "No se pudo agregar.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Guardar deuda · {formatMoney(plates * PRICE_CENTS)}
          </Button>
        </div>
      </div>
    </section>
  );
}
