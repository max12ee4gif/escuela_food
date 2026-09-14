import { getSql } from "@/lib/db";
import { formatPhone, normalizePhone } from "./phone";
import { PRICE_CENTS } from "./types";

export type DebtItem = {
  key: string;
  reservationId: number | null;
  extraId: number | null;
  name: string;
  phone: string;
  phoneDisplay: string;
  dishName: string;
  serviceDate: string;
  quantity: number;
  owedCents: number;
};

async function requireAdminSql() {
  const sql = await getSql();
  const { requireAdmin } = await import("./board.server");
  await requireAdmin(sql);
  try {
    await sql`alter table reservations add column if not exists owed_cents integer`;
  } catch {
    /* already there */
  }
  try {
    await sql`
      create table if not exists extra_debts (
        id serial primary key,
        name text not null,
        phone text not null default '',
        owed_cents integer not null default 0,
        note text not null default '',
        created_at timestamptz not null default now()
      )
    `;
  } catch {
    /* ok */
  }
  return sql;
}

export async function listDebtsData(): Promise<{ items: DebtItem[]; totalCents: number }> {
  const sql = await requireAdminSql();
  const reserved = await sql<{
    id: number;
    name: string;
    phone: string;
    quantity: number;
    owed_cents: number | null;
    dish_name: string;
    service_date: string;
  }>`
    select r.id, r.name, r.phone, r.quantity, r.owed_cents, d.dish_name, d.service_date::text as service_date
    from reservations r
    join service_days d on d.id = r.service_day_id
    where r.payment_status = 'debt'
    order by d.service_date desc, r.id desc
  `;
  const extras = await sql<{
    id: number;
    name: string;
    phone: string;
    owed_cents: number;
    note: string;
    created_at: string;
  }>`select id, name, phone, owed_cents, note, created_at::text from extra_debts where owed_cents > 0 order by id desc`;

  const items: DebtItem[] = [
    ...reserved.map((r) => ({
      key: `r-${r.id}`,
      reservationId: r.id,
      extraId: null,
      name: r.name,
      phone: r.phone,
      phoneDisplay: formatPhone(r.phone),
      dishName: r.dish_name,
      serviceDate: String(r.service_date).slice(0, 10),
      quantity: r.quantity,
      owedCents: r.owed_cents && r.owed_cents > 0 ? r.owed_cents : r.quantity * PRICE_CENTS,
    })),
    ...extras.map((e) => ({
      key: `e-${e.id}`,
      reservationId: null,
      extraId: e.id,
      name: e.name,
      phone: e.phone,
      phoneDisplay: e.phone ? formatPhone(e.phone) : "—",
      dishName: e.note || "Deuda extra",
      serviceDate: "",
      quantity: 0,
      owedCents: e.owed_cents,
    })),
  ];
  return { items, totalCents: items.reduce((n, i) => n + i.owedCents, 0) };
}

export async function adjustDebtData(input: {
  reservationId?: number | null;
  extraId?: number | null;
  deltaCents: number;
}): Promise<{ ok: true; owedCents: number }> {
  const sql = await requireAdminSql();
  const delta = Math.trunc(input.deltaCents);
  if (input.reservationId) {
    const rows = await sql<{ quantity: number; owed_cents: number | null; payment_status: string }>`
      select quantity, owed_cents, payment_status from reservations where id = ${input.reservationId}
    `;
    const row = rows[0];
    if (!row) throw new Error("Reserva no encontrada.");
    const current = row.owed_cents && row.owed_cents > 0 ? row.owed_cents : row.quantity * PRICE_CENTS;
    const next = Math.max(0, current + delta);
    const status = next === 0 ? "cash" : "debt";
    await sql`
      update reservations
      set owed_cents = ${next}, payment_status = ${status}
      where id = ${input.reservationId}
    `;
    return { ok: true, owedCents: next };
  }
  if (input.extraId) {
    const rows = await sql<{ owed_cents: number }>`select owed_cents from extra_debts where id = ${input.extraId}`;
    const row = rows[0];
    if (!row) throw new Error("Deuda no encontrada.");
    const next = Math.max(0, row.owed_cents + delta);
    if (next === 0) {
      await sql`delete from extra_debts where id = ${input.extraId}`;
    } else {
      await sql`update extra_debts set owed_cents = ${next} where id = ${input.extraId}`;
    }
    return { ok: true, owedCents: next };
  }
  throw new Error("Falta la deuda.");
}

export async function clearDebtData(input: {
  reservationId?: number | null;
  extraId?: number | null;
  as: "cash" | "none";
}): Promise<{ ok: true }> {
  const sql = await requireAdminSql();
  if (input.reservationId) {
    await sql`
      update reservations
      set owed_cents = 0, payment_status = ${input.as}
      where id = ${input.reservationId}
    `;
    return { ok: true };
  }
  if (input.extraId) {
    await sql`delete from extra_debts where id = ${input.extraId}`;
    return { ok: true };
  }
  throw new Error("Falta la deuda.");
}

export async function addExtraDebtData(input: {
  name: string;
  phone: string;
  amountCents: number;
  note: string;
}): Promise<{ id: number }> {
  const sql = await requireAdminSql();
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Pon el nombre.");
  const amount = Math.max(100, Math.trunc(input.amountCents));
  const phone = normalizePhone(input.phone) || input.phone.trim();
  const inserted = await sql<{ id: number }>`
    insert into extra_debts (name, phone, owed_cents, note)
    values (${name}, ${phone}, ${amount}, ${input.note.trim()})
    returning id
  `;
  if (!inserted[0]) throw new Error("No se pudo guardar la deuda.");
  return { id: inserted[0].id };
}
