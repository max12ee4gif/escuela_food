import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDish, deleteDish } from "@/lib/lunch/api";
import { compressImage } from "@/lib/compress-image";
import { DISH_PRESETS } from "@/lib/lunch/presets";
import type { DishPreset } from "@/lib/lunch/types";

type Props = {
  dishes?: DishPreset[];
  dishName: string;
  onPick: (dish: DishPreset) => void;
  onRefresh: () => void;
};

export function DishCasillas({ dishes, dishName, onPick, onRefresh }: Props) {
  const [extras, setExtras] = useState<DishPreset[]>([]);
  const list = useMemo(() => {
    const base =
      dishes && dishes.length > 0
        ? dishes
        : DISH_PRESETS.map((p) => ({ ...p, builtIn: true }));
    const known = new Set(base.map((d) => d.id));
    return [...base, ...extras.filter((d) => !known.has(d.id))];
  }, [dishes, extras]);

  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("Trae efectivo.");
  const [newPhoto, setNewPhoto] = useState("");
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div>
        <p className="mb-2 text-sm font-medium text-muted">Casillas de platillos</p>
        <div className="grid grid-cols-3 gap-2">
          {list.map((p) => (
            <div
              key={p.id}
              className={`relative overflow-hidden rounded-md border text-left ${
                dishName === p.name ? "border-ink" : "border-line"
              }`}
            >
              <button type="button" onClick={() => onPick(p)} className="block w-full text-left">
                {p.photo ? (
                  <img src={p.photo} alt="" className="h-16 w-full object-cover" />
                ) : (
                  <div className="flex h-16 w-full items-center justify-center bg-line text-[11px] text-muted">
                    Sin foto
                  </div>
                )}
                <span className="block truncate px-2 py-1 text-[11px] font-medium text-ink">
                  {p.name}
                </span>
              </button>
              {!p.builtIn && (
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-white/90 px-1 text-[10px] text-ink"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      await deleteDish({ data: { id: p.id } });
                      setExtras((prev) => prev.filter((d) => d.id !== p.id));
                      toast.success("Platillo quitado de las casillas.");
                      onRefresh();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "No se pudo borrar.");
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-raised p-3">
        <p className="mb-2 text-sm font-medium text-ink">Agregar otra casilla</p>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Nombre del platillo"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="Notas (opcional)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="h-10 w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-sm file:border-0 file:bg-line file:px-3 file:text-sm file:font-medium file:text-ink"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void compressImage(file)
                .then(setNewPhoto)
                .catch(() => toast.error("No se pudo leer la foto."));
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={adding || newName.trim().length < 2}
            onClick={async () => {
              setAdding(true);
              try {
                await addDish({
                  data: { name: newName.trim(), notes: newNotes.trim(), photo: newPhoto },
                });
                const created: DishPreset = {
                  id: "tmp-" + Date.now(),
                  name: newName.trim(),
                  notes: newNotes.trim(),
                  photo: newPhoto,
                  builtIn: false,
                };
                setExtras((prev) => [...prev, created]);
                onPick(created);
                setNewName("");
                toast.success("Casilla agregada. Ya puedes publicarla.");
                onRefresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "No se pudo agregar.");
              } finally {
                setAdding(false);
              }
            }}
          >
            {adding ? "Guardando…" : "Guardar casilla"}
          </Button>
        </div>
      </div>
    </>
  );
}
