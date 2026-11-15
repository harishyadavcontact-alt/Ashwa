-- Ashwa pilot schema v2.1: the four blockers from docs/product-audit.md.
--   G1 driver verification (only verified drivers appear in parent search)
--   G2 parent consent and delete-my-data
--   G3 analytics events (no child names, pseudonymous user id only)
--   G4 parent alerts are rendered from trip events in the app (see src/logic/alerts.ts)
-- Apply after 0001. Do not put personal identity numbers (Aadhaar, licence, PAN) in any column.

-- ---------- Columns ----------

alter table public.drivers
  add column if not exists verification_status text not null default 'PENDING'
    check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
  add column if not exists verified_at timestamptz;

alter table public.parents
  add column if not exists consent_at timestamptz;

-- ---------- Admins (you, the founder). Insert your auth user id once, in the SQL editor. ----------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;
-- No policies: admins are managed from the SQL editor or service role only.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- A driver cannot change their own verification status. Only an admin, through set_driver_status, can.
create or replace function public.guard_verification() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.verification_status is distinct from old.verification_status and not public.is_admin() then
    raise exception 'Only the Ashwa team can change verification status';
  end if;
  return new;
end $$;

drop trigger if exists guard_verification on public.drivers;
create trigger guard_verification before update on public.drivers
  for each row execute function public.guard_verification();

create or replace function public.set_driver_status(p_driver uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_status not in ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED') then raise exception 'Bad status'; end if;
  update public.drivers
     set verification_status = p_status,
         verified_at = case when p_status = 'VERIFIED' then now() else null end
   where id = p_driver;
end $$;

-- ---------- Search: verified drivers only ----------

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
  where d.verification_status = 'VERIFIED'
    and (lower(r.school_name) like '%' || lower(trim(p_school)) || '%'
         or lower(trim(p_school)) like '%' || lower(r.school_name) || '%')
    and r.van_seats - (select count(*) from public.children c where c.route_id = r.id) > 0
  order by 6;
$$;

-- Admin list of drivers waiting for review (names and seats only).
create or replace function public.admin_drivers(p_status text default 'PENDING')
returns table (id uuid, name text, van_seats int, verification_status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select d.id, d.name, d.van_seats, d.verification_status, d.created_at
    from public.drivers d
   where public.is_admin() and d.verification_status = p_status
   order by d.created_at;
$$;

-- ---------- Analytics (G3) ----------

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  props jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "users write their own events" on public.analytics_events for insert to authenticated
  with check (user_id = auth.uid());

create or replace function public.admin_event_counts(p_days int default 7)
returns table (name text, n bigint)
language sql stable security definer set search_path = public as $$
  select e.name, count(*)
    from public.analytics_events e
   where public.is_admin() and e.created_at > now() - make_interval(days => p_days)
   group by e.name
   order by 2 desc;
$$;

-- ---------- Delete my data (G2) ----------

-- A parent can erase their personal data. Children stay on the driver's list (for fee records) but are anonymised.
create or replace function public.delete_my_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.children
     set parent_id = null, parent_phone = '', first_name = 'Deleted'
   where parent_id = auth.uid();
  delete from public.parents where id = auth.uid();
  delete from public.analytics_events where user_id = auth.uid();
end $$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.set_driver_status(uuid, text) to authenticated;
grant execute on function public.admin_drivers(text) to authenticated;
grant execute on function public.admin_event_counts(int) to authenticated;
grant execute on function public.delete_my_data() to authenticated;
