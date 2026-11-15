-- Ashwa pilot schema v1. Minimal: only what the pilot flow needs (see strategy/07-pilot-mvp-spec.md).
-- No child photos, no DOB, no ID numbers. Location is kept only for active trips.
-- Known gap before public launch: driver base coordinates are readable by that driver's linked parents.
-- Move base coordinates to a driver-only table (see strategy/11-tech-stack-and-shipping.md).

create table if not exists public.drivers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  van_seats int not null check (van_seats between 1 and 15),
  base_lat double precision,
  base_lng double precision,
  verification_status text not null default 'PENDING'
    check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
  created_at timestamptz not null default now()
);

create table if not exists public.parents (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  first_name text not null,
  school_name text not null,
  school_lat double precision,
  school_lng double precision,
  pickup_label text,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  drop_label text,
  drop_lat double precision not null,
  drop_lng double precision not null,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id) on delete cascade,
  trip_type text not null check (trip_type in ('MORNING', 'AFTERNOON')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now(),
  unique (trip_id, child_id, event_type)
);

create table if not exists public.driver_locations (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

-- Founder CRM: no policies, so only the dashboard or service role can read it.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('DRIVER', 'PARENT', 'NEW_PARENT', 'OWNER', 'SCHOOL', 'FUNDER', 'RECRUIT', 'GOVT')),
  name text,
  phone text,
  stage text not null,
  source text,
  notes text,
  updated_at timestamptz not null default now()
);

-- Row Level Security: each user sees only their own rows, plus what their children need.
alter table public.drivers enable row level security;
alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.trips enable row level security;
alter table public.trip_events enable row level security;
alter table public.driver_locations enable row level security;
alter table public.leads enable row level security;

create policy "driver manages own profile" on public.drivers
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "parent reads drivers of own children" on public.drivers
  for select using (
    exists (select 1 from public.children c where c.driver_id = drivers.id and c.parent_id = auth.uid())
  );

create policy "parent manages own profile" on public.parents
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "parent sees own children" on public.children
  for select using (auth.uid() = parent_id);

create policy "parent adds own children" on public.children
  for insert with check (auth.uid() = parent_id);

create policy "driver sees children assigned to them" on public.children
  for select using (auth.uid() = driver_id);

create policy "driver manages own trips" on public.trips
  for all using (auth.uid() = driver_id) with check (auth.uid() = driver_id);

create policy "parent reads trips of own children's drivers" on public.trips
  for select using (
    exists (select 1 from public.children c where c.driver_id = trips.driver_id and c.parent_id = auth.uid())
  );

create policy "driver writes events for own trips" on public.trip_events
  for insert with check (exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid()));

create policy "parent reads events for own children" on public.trip_events
  for select using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));

create policy "driver writes own location" on public.driver_locations
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid()));

create policy "parent reads location of active trip for own child" on public.driver_locations
  for select using (
    exists (
      select 1 from public.trips t
      join public.children c on c.driver_id = t.driver_id
      where t.id = trip_id and t.ended_at is null and c.parent_id = auth.uid()
    )
  );
