create table if not exists dish_catalog (
  id text primary key,
  name text not null,
  photo text not null default '',
  notes text not null default '',
  built_in boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists dish_catalog_created_idx on dish_catalog (created_at asc);
