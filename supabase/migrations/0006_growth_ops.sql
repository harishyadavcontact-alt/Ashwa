-- Ashwa pilot schema v2.5: referrals, waitlist, incidents, absences, backup drivers, push, funnel.
-- Every referral is made by a user's own code (drivers and parents). Opens are counted without sign-in.

-- ---------- Driver contact (kept apart from the public driver row) ----------

create table if not exists public.driver_contacts (
  driver_id uuid primary key references public.drivers (id) on delete cascade,
  phone text not null -- last 10 digits
);
alter table public.driver_contacts enable row level security;
create policy "driver reads own contact" on public.driver_contacts for select to authenticated
  using (driver_id = auth.uid());
create policy "driver writes own contact" on public.driver_contacts for all to authenticated
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());

-- Store the signed-in driver's number (used by parents on the same route for WhatsApp).
create or replace function public.sync_my_phone() returns void
language plpgsql security definer set search_path = public as $$
declare key text;
begin
  key := right(regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g'), 10);
  if key = '' or not exists (select 1 from public.drivers where id = auth.uid()) then return; end if;
  insert into public.driver_contacts (driver_id, phone) values (auth.uid(), key)
    on conflict (driver_id) do update set phone = excluded.phone;
end $$;

-- A parent with a child on this route can see the driver's number. Nobody else can.
create or replace function public.driver_phone_for_route(p_route uuid) returns text
language sql stable security definer set search_path = public as $$
  select dc.phone
    from public.routes r
    join public.driver_contacts dc on dc.driver_id = r.owner_id
   where r.id = p_route
     and exists (select 1 from public.children c where c.route_id = p_route and c.parent_id = auth.uid());
$$;

-- ---------- Referrals ----------

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  event text not null check (event in ('OPEN', 'JOIN')),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.referral_events enable row level security; -- no direct access; functions only

create or replace function public.referral_owner(p_code text) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare owner uuid; code text := upper(trim(p_code));
begin
  select id into owner from public.drivers where referral_code = code;
  if owner is null then
    select id into owner from public.parents where referral_code = code;
  end if;
  return owner;
end $$;

-- Called when someone opens a referral link, before they sign in.
create or replace function public.track_referral_open(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.referral_owner(p_code) is not null then
    insert into public.referral_events (code, event) values (upper(trim(p_code)), 'OPEN');
  end if;
end $$;

-- Called once a new user has a profile. Records who referred them and counts the join.
create or replace function public.redeem_referral(p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare owner uuid; code text := upper(trim(p_code));
begin
  owner := public.referral_owner(code);
  if owner is null or owner = auth.uid() then return; end if;
  if exists (select 1 from public.referral_events where user_id = auth.uid() and event = 'JOIN') then return; end if;
  update public.drivers set referred_by = code where id = auth.uid() and referred_by is null;
  update public.parents set referred_by = code where id = auth.uid() and referred_by is null;
  insert into public.referral_events (code, event, user_id) values (code, 'JOIN', auth.uid());
end $$;

create or replace function public.my_referral_stats() returns table (opens bigint, joins bigint)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where e.event = 'OPEN'),
    count(*) filter (where e.event = 'JOIN')
  from public.referral_events e
  where e.code in (
    select referral_code from public.drivers where id = auth.uid()
    union
    select referral_code from public.parents where id = auth.uid()
  );
$$;

-- ---------- Waitlist (new parents when no van matches) ----------

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents (id) on delete set null,
  phone text not null,
  first_name text not null,
  school_name text not null,
  pickup_label text not null default '',
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'MATCHED', 'CLOSED')),
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security; -- functions only

create or replace function public.join_waitlist(p_first_name text, p_school text, p_label text, p_lat float, p_lng float)
returns uuid language plpgsql security definer set search_path = public as $$
declare key text; wid uuid;
begin
  if not exists (select 1 from public.parents where id = auth.uid()) then raise exception 'Create your profile first'; end if;
  key := right(regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g'), 10);
  insert into public.waitlist (parent_id, phone, first_name, school_name, pickup_label, pickup_lat, pickup_lng)
    values (auth.uid(), key, trim(p_first_name), trim(p_school), coalesce(p_label, ''), p_lat, p_lng)
    returning id into wid;
  return wid;
end $$;

create or replace function public.admin_waitlist() returns table (
  id uuid, first_name text, school_name text, pickup_label text, pickup_lat float, pickup_lng float, status text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select w.id, w.first_name, w.school_name, w.pickup_label, w.pickup_lat, w.pickup_lng, w.status, w.created_at
    from public.waitlist w where public.is_admin() order by w.created_at desc;
$$;

-- ---------- Incidents ("Report a problem") ----------

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  reporter_id uuid not null references auth.users (id),
  kind text not null,
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now()
);
alter table public.incidents enable row level security;

create or replace function public.report_incident(p_route uuid, p_kind text, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare iid uuid;
begin
  if not public.can_manage_route(p_route) then raise exception 'Not on this route'; end if;
  insert into public.incidents (route_id, reporter_id, kind, note)
    values (p_route, auth.uid(), p_kind, coalesce(left(p_note, 500), ''))
    returning id into iid;
  return iid;
end $$;

create or replace function public.admin_incidents() returns table (
  id uuid, route_id uuid, kind text, note text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select i.id, i.route_id, i.kind, i.note, i.created_at from public.incidents i
   where public.is_admin() order by i.created_at desc;
$$;

-- ---------- Absences (child not coming today) ----------

create table if not exists public.absences (
  child_id uuid not null references public.children (id) on delete cascade,
  day date not null,
  primary key (child_id, day)
);
alter table public.absences enable row level security;
create policy "team manages absences" on public.absences for all to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and public.can_manage_route(c.route_id)))
  with check (exists (select 1 from public.children c where c.id = child_id and public.can_manage_route(c.route_id)));
create policy "parent reads absences" on public.absences for select to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()));

-- ---------- Backup drivers ----------

create table if not exists public.backup_requests (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  requested_by uuid not null references auth.users (id),
  day date not null,
  note text not null default '' check (length(note) <= 200),
  status text not null default 'OPEN' check (status in ('OPEN', 'COVERED', 'CANCELLED')),
  covered_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.backup_requests enable row level security;
create policy "team reads backup requests" on public.backup_requests for select to authenticated
  using (public.can_manage_route(route_id));

create or replace function public.request_backup(p_route uuid, p_day date, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare bid uuid;
begin
  if not public.can_manage_route(p_route) then raise exception 'Not on this route'; end if;
  insert into public.backup_requests (route_id, requested_by, day, note)
    values (p_route, auth.uid(), p_day, coalesce(left(p_note, 200), '')) returning id into bid;
  return bid;
end $$;

-- Verified drivers see open backup requests (school, day, and the route owner's name only).
create or replace function public.open_backups() returns table (
  id uuid, route_id uuid, route_name text, school_name text, day date, note text, owner_name text
)
language sql stable security definer set search_path = public as $$
  select b.id, r.id, r.name, r.school_name, b.day, b.note, d.name
    from public.backup_requests b
    join public.routes r on r.id = b.route_id
    join public.drivers d on d.id = r.owner_id
   where b.status = 'OPEN' and b.day >= current_date
     and exists (select 1 from public.drivers me where me.id = auth.uid() and me.verification_status = 'VERIFIED')
     and b.requested_by <> auth.uid()
   order by b.day;
$$;

create or replace function public.cover_backup(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.drivers where id = auth.uid() and verification_status = 'VERIFIED') then
    raise exception 'Only verified drivers can cover a route';
  end if;
  update public.backup_requests set status = 'COVERED', covered_by = auth.uid()
   where id = p_id and status = 'OPEN';
  if not found then raise exception 'That backup is no longer open'; end if;
end $$;

-- ---------- Push subscriptions (web push) ----------

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  keys jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "user manages own push" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Founder funnel ----------

create or replace function public.admin_funnel(p_days int default 30) returns table (stage text, n bigint)
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => p_days);
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
  select 'Invite opened'::text, count(*) from public.referral_events where event = 'OPEN' and created_at > since
  union all select 'Joined by referral', count(*) from public.referral_events where event = 'JOIN' and created_at > since
  union all select 'Drivers signed up', count(*) from public.drivers where created_at > since
  union all select 'Drivers verified', count(*) from public.drivers where verification_status = 'VERIFIED' and verified_at > since
  union all select 'Routes created', count(*) from public.routes where created_at > since
  union all select 'Customers added', count(*) from public.children where created_at > since
  union all select 'Customers joined', count(*) from public.children where parent_id is not null and created_at > since
  union all select 'Runs started', count(*) from public.trips where started_at > since
  union all select 'Payments reported', count(*) from public.payments where updated_at > since
  union all select 'Payments confirmed', count(*) from public.payments where status = 'PAID' and updated_at > since
  union all select 'Waitlist requests', count(*) from public.waitlist where created_at > since
  union all select 'Problems reported', count(*) from public.incidents where created_at > since;
end $$;

-- ---------- Driver's own week ----------

create or replace function public.my_week_stats() returns table (runs bigint, families bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.trips t where t.started_by = auth.uid() and t.started_at > now() - interval '7 days'),
    (select count(*) from public.children c join public.routes r on r.id = c.route_id where r.owner_id = auth.uid());
$$;

-- ---------- Grants ----------

grant execute on function public.sync_my_phone() to authenticated;
grant execute on function public.driver_phone_for_route(uuid) to authenticated;
grant execute on function public.track_referral_open(text) to anon, authenticated;
grant execute on function public.redeem_referral(text) to authenticated;
grant execute on function public.my_referral_stats() to authenticated;
grant execute on function public.join_waitlist(text, text, text, float, float) to authenticated;
grant execute on function public.admin_waitlist() to authenticated;
grant execute on function public.report_incident(uuid, text, text) to authenticated;
grant execute on function public.admin_incidents() to authenticated;
grant execute on function public.request_backup(uuid, date, text) to authenticated;
grant execute on function public.open_backups() to authenticated;
grant execute on function public.cover_backup(uuid) to authenticated;
grant execute on function public.admin_funnel(int) to authenticated;
grant execute on function public.my_week_stats() to authenticated;
