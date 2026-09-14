alter table reservations add column if not exists owed_cents integer;

create table if not exists extra_debts (
  id serial primary key,
  name text not null,
  phone text not null default '',
  owed_cents integer not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);
