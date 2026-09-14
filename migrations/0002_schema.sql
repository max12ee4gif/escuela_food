-- Hoy Hay: daily high-school lunch plates (unowned rows; admin gated in app code)

create table if not exists settings (
  id integer primary key check (id = 1),
  max_per_person integer not null default 3,
  capacity integer not null default 10,
  price_cents integer not null default 1000,
  timezone text not null default 'America/Chicago',
  cutoff_hour integer not null default 8,
  leftover_end_hour integer not null default 15,
  admin_username text not null default 'admin',
  admin_password_hash text not null,
  vendor_phone text,
  sms_enabled boolean not null default false,
  phase_override text,
  updated_at timestamptz not null default now()
);

create table if not exists service_days (
  id serial primary key,
  service_date date not null unique,
  dish_name text not null,
  photo_url text,
  notes text,
  capacity integer not null default 10,
  price_cents integer not null default 1000,
  status text not null default 'open',
  cancel_message text,
  created_at timestamptz not null default now()
);

create index if not exists service_days_date_idx on service_days (service_date desc);

create table if not exists reservations (
  id serial primary key,
  service_day_id integer not null references service_days(id) on delete cascade,
  name text not null,
  phone text not null,
  quantity integer not null check (quantity > 0),
  payment_method text not null default 'cash',
  payment_status text not null default 'pending',
  delivery_status text not null default 'reserved',
  phone_verified boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists reservations_day_idx on reservations (service_day_id);
create index if not exists reservations_phone_idx on reservations (phone);

create table if not exists sms_challenges (
  id serial primary key,
  phone text not null,
  code_hash text not null,
  name text not null,
  quantity integer not null,
  payment_method text not null,
  service_day_id integer not null references service_days(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sms_challenges_phone_idx on sms_challenges (phone);

create table if not exists admin_sessions (
  token text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
