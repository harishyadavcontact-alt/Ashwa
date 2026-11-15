-- Ashwa pilot schema v2 (replaces v1; v1 was never applied anywhere).
-- Model: a driver owns routes (one van, one school, one start point). Routes have ordered stops in two directions:
--   TO_SCHOOL: start -> stops -> school      TO_HOME: school -> stops -> start
-- Children (customers) are created by the driver and linked to a parent by phone when the parent joins.
-- No child photos, no DOB, no ID numbers. Live location is kept only for active trips.

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists public.drivers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  van_seats int not null check (van_seats between 1 and 15),
  created_at timestamptz not null default now()
);

create table if not exists public.parents (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null,
  referral_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  referred_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.drivers (id) on delete cascade,
  code text not null unique,
  name text not null,
  school_name text not null,
  school_lat double precision not null,
  school_lng double precision not null,
  start_lat double precision not null,
  start_lng double precision not null,
  start_label text not null default 'Van base',
  van_seats int not null check (van_seats between 1 and 15),
  created_at timestamptz not null default now()
);

create table if not exists public.route_members (
  route_id uuid not null references public.routes (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  primary key (route_id, driver_id)
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  direction text not null check (direction in ('TO_SCHOOL', 'TO_HOME')),
  stop_order int not null,
  lat double precision not null,
  lng double precision not null,
  label text not null default '',
  unique (route_id, direction, stop_order) deferrable initially deferred
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  parent_id uuid references public.parents (id) on delete set null,
  parent_phone text not null, -- last 10 digits
  first_name text not null,
  school_name text not null,
  to_school_stop_id uuid not null references public.route_stops (id),
  to_home_stop_id uuid not null references public.route_stops (id),
  monthly_fee int not null default 0 check (monthly_fee >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  started_by uuid not null references public.drivers (id),
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

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount int not null check (amount >= 0),
  status text not null check (status in ('REPORTED', 'PAID')),
  method text not null default '',
  reference text not null default '',
  updated_at timestamptz not null default now(),
  unique (child_id, month)
);

-- Founder CRM: no policies, so only the dashboard or service role can read it.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text,
  phone text,
  stage text not null,
  source text,
  notes text,
  updated_at timestamptz not null default now()
);

-- ---------- Helpers (security definer, so policies stay simple) ----------

-- True if the signed-in user owns or has joined this route.
create or replace function public.can_manage_route(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.routes r where r.id = rid and r.owner_id = auth.uid())
      or exists (select 1 from public.route_members m where m.route_id = rid and m.driver_id = auth.uid());
$$;

-- True if the signed-in parent has at least one child on this route.
create or replace function public.parent_on_route(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.children c where c.route_id = rid and c.parent_id = auth.uid());
$$;

-- Rough metres between two points (fine at city scale).
create or replace function public.dist_m(lat1 float, lng1 float, lat2 float, lng2 float) returns float
language sql immutable as $$
  select sqrt(power((lng2 - lng1) * cos(radians((lat1 + lat2) / 2)), 2) + power(lat2 - lat1, 2)) * 111320;
$$;

-- Parent search: routes serving a school with seats left, nearest first. Returns no codes or addresses.
create or replace function public.search_routes(p_school text, p_lat float, p_lng float)
returns table (route_id uuid, route_name text, school_name text, driver_name text, seats_left int, distance_m int)
language sql stable security definer set search_path = public as $$
  select r.id,
         r.name,
         r.school_name,
         d.name,
         r.van_seats - (select count(*)::int from public.children c where c.route_id = r.id),
         coalesce(
           (select min(public.dist_m(p_lat, p_lng, s.lat, s.lng))
              from public.route_stops s where s.route_id = r.id and s.direction = 'TO_SCHOOL'),
           public.dist_m(p_lat, p_lng, r.start_lat, r.start_lng)
         )::int
  from public.routes r
  join public.drivers d on d.id = r.owner_id
  where (lower(r.school_name) like '%' || lower(trim(p_school)) || '%'
         or lower(trim(p_school)) like '%' || lower(r.school_name) || '%')
    and r.van_seats - (select count(*) from public.children c where c.route_id = r.id) > 0
  order by 6;
$$;

-- Name of the driver who runs a route (parents can see this, not the route itself).
create or replace function public.route_driver_name(p_route_id uuid) returns text
language sql stable security definer set search_path = public as $
  select d.name from public.routes r join public.drivers d on d.id = r.owner_id where r.id = p_route_id;
$;

-- Join a route with its code (drivers only, via the code the owner shares).
create or replace function public.join_route(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  select id into rid from public.routes where code = upper(trim(p_code));
  if rid is null then raise exception 'No route with that code'; end if;
  insert into public.route_members (route_id, driver_id) values (rid, auth.uid())
    on conflict do nothing;
  return rid;
end $$;

-- Parent enrols a child on a route: adds a stop at the end of each direction if no stop is within 30 m.
-- The driver can reorder stops afterwards.
create or replace function public.enrol_child(p_route_id uuid, p_first_name text, p_lat float, p_lng float, p_label text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  r record; kids int; s_school uuid; s_home uuid; nxt int; phone_key text; cid uuid;
begin
  select * into r from public.routes where id = p_route_id;
  if r.id is null then raise exception 'Van not found'; end if;
  if not exists (select 1 from public.parents where id = auth.uid()) then raise exception 'Create your profile first'; end if;
  select count(*) into kids from public.children where route_id = p_route_id;
  if kids >= r.van_seats then raise exception 'This van is full'; end if;

  select id into s_school from public.route_stops
   where route_id = p_route_id and direction = 'TO_SCHOOL' and public.dist_m(p_lat, p_lng, lat, lng) <= 30 limit 1;
  if s_school is null then
    select coalesce(max(stop_order), -1) + 1 into nxt from public.route_stops where route_id = p_route_id and direction = 'TO_SCHOOL';
    insert into public.route_stops (route_id, direction, stop_order, lat, lng, label)
      values (p_route_id, 'TO_SCHOOL', nxt, p_lat, p_lng, coalesce(p_label, 'Pickup')) returning id into s_school;
  end if;

  select id into s_home from public.route_stops
   where route_id = p_route_id and direction = 'TO_HOME' and public.dist_m(p_lat, p_lng, lat, lng) <= 30 limit 1;
  if s_home is null then
    select coalesce(max(stop_order), -1) + 1 into nxt from public.route_stops where route_id = p_route_id and direction = 'TO_HOME';
    insert into public.route_stops (route_id, direction, stop_order, lat, lng, label)
      values (p_route_id, 'TO_HOME', nxt, p_lat, p_lng, coalesce(p_label, 'Drop')) returning id into s_home;
  end if;

  select right(regexp_replace(phone, '\D', '', 'g'), 10) into phone_key from public.parents where id = auth.uid();
  insert into public.children (route_id, parent_id, parent_phone, first_name, school_name, to_school_stop_id, to_home_stop_id)
    values (p_route_id, auth.uid(), phone_key, trim(p_first_name), r.school_name, s_school, s_home)
    returning id into cid;
  return cid;
end $$;

-- After sign-in, link any children a driver added under this parent's phone number.
create or replace function public.claim_children() returns int
language plpgsql security definer set search_path = public as $$
declare key text; n int;
begin
  key := right(regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g'), 10);
  if key = '' then return 0; end if;
  update public.children set parent_id = auth.uid()
   where parent_id is null and parent_phone = key;
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on function public.search_routes(text, float, float) to authenticated;
grant execute on function public.join_route(text) to authenticated;
grant execute on function public.enrol_child(uuid, text, float, float, text) to authenticated;
grant execute on function public.claim_children() to authenticated;
grant execute on function public.route_driver_name(uuid) to authenticated;

-- ---------- Row Level Security ----------

alter table public.drivers enable row level security;
alter table public.parents enable row level security;
alter table public.routes enable row level security;
alter table public.route_members enable row level security;
alter table public.route_stops enable row level security;
alter table public.children enable row level security;
alter table public.trips enable row level security;
alter table public.trip_events enable row level security;
alter table public.driver_locations enable row level security;
alter table public.payments enable row level security;
alter table public.leads enable row level security;

-- Drivers: anyone signed in can see a driver's name and seats (needed for search); only the driver edits their row.
create policy "drivers read" on public.drivers for select to authenticated using (true);
create policy "driver edits own" on public.drivers for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "parent edits own" on public.parents for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "owner manages route" on public.routes for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "member reads route" on public.routes for select to authenticated
  using (public.can_manage_route(id));

create policy "driver sees own memberships" on public.route_members for select to authenticated
  using (driver_id = auth.uid() or public.can_manage_route(route_id));
create policy "owner manages members" on public.route_members for all to authenticated
  using (exists (select 1 from public.routes r where r.id = route_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.routes r where r.id = route_id and r.owner_id = auth.uid()));

create policy "route team manages stops" on public.route_stops for all to authenticated
  using (public.can_manage_route(route_id)) with check (public.can_manage_route(route_id));

create policy "team and parents read children" on public.children for select to authenticated
  using (public.can_manage_route(route_id) or parent_id = auth.uid());
-- Parents can read only the two stops their own children use (pickup and drop), not the rest of the route.
create policy "parent reads own children stops" on public.route_stops for select to authenticated
  using (exists (select 1 from public.children c where c.parent_id = auth.uid()
    and (c.to_school_stop_id = id or c.to_home_stop_id = id)));

create policy "team manages children" on public.children for all to authenticated
  using (public.can_manage_route(route_id)) with check (public.can_manage_route(route_id));

create policy "team and parents read trips" on public.trips for select to authenticated
  using (public.can_manage_route(route_id) or public.parent_on_route(route_id));
create policy "team starts trips" on public.trips for insert to authenticated
  with check (public.can_manage_route(route_id) and started_by = auth.uid());
create policy "team ends trips" on public.trips for update to authenticated
  using (public.can_manage_route(route_id)) with check (public.can_manage_route(route_id));

create policy "team writes events" on public.trip_events for insert to authenticated
  with check (exists (select 1 from public.trips t where t.id = trip_id and public.can_manage_route(t.route_id)));
create policy "team and parents read events" on public.trip_events for select to authenticated
  using (
    exists (select 1 from public.trips t where t.id = trip_id and public.can_manage_route(t.route_id))
    or exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "team writes location" on public.driver_locations for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and public.can_manage_route(t.route_id)))
  with check (exists (select 1 from public.trips t where t.id = trip_id and public.can_manage_route(t.route_id)));
create policy "parents read location during trip" on public.driver_locations for select to authenticated
  using (exists (
    select 1 from public.trips t
    where t.id = trip_id and t.ended_at is null and public.parent_on_route(t.route_id)
  ));

-- Payments: the team sees and records everything on its route. A parent sees their child's payments,
-- and can only report a payment (status REPORTED), never mark it PAID.
create policy "team manages payments" on public.payments for all to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and public.can_manage_route(c.route_id)))
  with check (exists (select 1 from public.children c where c.id = child_id and public.can_manage_route(c.route_id)));
create policy "parent reads payments" on public.payments for select to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));
create policy "parent reports payment" on public.payments for insert to authenticated
  with check (status = 'REPORTED' and exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));
create policy "parent updates own report" on public.payments for update to authenticated
  using (status = 'REPORTED' and exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()))
  with check (status = 'REPORTED' and exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));
