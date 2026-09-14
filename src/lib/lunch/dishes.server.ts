import type { Sql } from "@/lib/db";
import { DISH_PRESETS } from "./presets";

export async function seedDishCatalog(sql: Sql): Promise<void> {
  const existing = await sql<{ n: number }>`select count(*)::int as n from dish_catalog`;
  if (Number(existing[0]?.n ?? 0) > 0) return;
  for (const p of DISH_PRESETS) {
    await sql`
      insert into dish_catalog (id, name, photo, notes, built_in)
      values (${p.id}, ${p.name}, ${p.photo}, ${p.notes}, true)
      on conflict (id) do nothing
    `;
  }
}

export async function listDishes(sql: Sql) {
  try {
    const rows = await sql<{
      id: string;
      name: string;
      photo: string;
      notes: string;
      built_in: boolean;
    }>`select id, name, photo, notes, built_in from dish_catalog order by created_at asc, id asc`;
    if (rows.length === 0) {
      await seedDishCatalog(sql);
      return listDishes(sql);
    }
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      photo: r.photo,
      notes: r.notes,
      builtIn: Boolean(r.built_in),
    }));
  } catch {
    return DISH_PRESETS.map((p) => ({ ...p, builtIn: true }));
  }
}
