import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publishDay } from "@/lib/lunch/api";
import { compressImage } from "@/lib/compress-image";
import { DISH_PRESETS } from "@/lib/lunch/presets";
import { DishCasillas } from "@/components/admin/dish-casillas";
import { nextServiceDate, readClock } from "@/lib/lunch/time";
import type { AdminBoard } from "@/lib/lunch/types";

export function PublishCard({ board, onRefresh }: { board: AdminBoard; onRefresh: () => void }) {
  const day = board.day;
  const defaultDate = day?.serviceDate ?? nextServiceDate(readClock());
  const [serviceDate, setServiceDate] = useState(defaultDate);
  const [dishName, setDishName] = useState(day?.dishName ?? DISH_PRESETS[0].name);
  const [photoUrl, setPhotoUrl] = useState<string | null>(day?.photoUrl ?? DISH_PRESETS[0].photo);
  const [notes, setNotes] = useState(day?.notes ?? DISH_PRESETS[0].notes);
  const [capacity, setCapacity] = useState(day?.capacity ?? board.defaultCapacity);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setPhotoUrl(await compressImage(file));
    } catch {
      toast.error("No se pudo leer la foto.");
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Publicar el día</h2>
        <p className="text-sm text-muted">Elige platillo, foto y notas. Se ve en la home al instante.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Fecha de venta</Label>
        <Input id="date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
      </div>
      <DishCasillas
        dishes={board.dishes}
        dishName={dishName}
        onRefresh={onRefresh}
        onPick={(p) => {
          setDishName(p.name);
          setPhotoUrl(p.photo || null);
          setNotes(p.notes);
        }}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="dish">Nombre</Label>
        <Input id="dish" value={dishName} onChange={(e) => setDishName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas</Label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-md border border-line bg-raised px-4 py-3 text-base text-ink outline-none focus:ring-2 focus:ring-chili/25" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cap">Capacidad</Label>
          <Input id="cap" type="number" min={1} max={40} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="photo">Foto (celular)</Label>
          <input id="photo" type="file" accept="image/*" capture="environment" className="h-12 w-full text-sm text-muted file:mr-3 file:h-10 file:rounded-sm file:border-0 file:bg-line file:px-3 file:text-sm file:font-medium file:text-ink" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
      </div>
      {photoUrl && <img src={photoUrl} alt="" className="h-40 w-full rounded-lg object-cover" />}
      <Button size="lg" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          await publishDay({ data: { serviceDate, dishName, photoUrl, notes, capacity } });
          toast.success("Publicado. Ya se ve en la home.");
          onRefresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo publicar.");
        } finally {
          setBusy(false);
        }
      }}>
        {busy ? "Publicando…" : day ? "Actualizar platillo" : "Publicar platillo"}
      </Button>
    </section>
  );
}
