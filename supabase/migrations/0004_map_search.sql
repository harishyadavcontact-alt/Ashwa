-- Ashwa pilot schema v2.3: pins link to families; school suggestions for parents.
-- route_map now returns each stop's id, so a driver can tap a pin and see its families.

drop function if exists public.route_map(uuid);

create or replace function public.route_map(p_route_id uuid)
returns table (
  id uuid,
  kind text,
  direction text,
  stop_order int,
  lat float,
  lng float,
  label text,
  child_count int,
  names text[]
)
language plpgsql stable security definer set search_path = public as $$
declare
  team boolean;
begin
  team := public.can_manage_route(p_route_id);
  if not team and not public.parent_on_route(p_route_id) then
    raise exception 'Not on this route';
  end if;

  return query
  select null::uuid, 'START'::text, null::text, 0, r.start_lat, r.start_lng, r.start_label, 0, null::text[]
    from public.routes r
   where r.id = p_route_id and team

  union all

  select null::uuid, 'SCHOOL'::text, null::text, 0, r.school_lat, r.school_lng, r.school_name, 0, null::text[]
    from public.routes r
   where r.id = p_route_id

  union all

  select s.id, 'STOP'::text, s.direction, s.stop_order, s.lat, s.lng, s.label,
         (select count(*)::int from public.children c
           where c.route_id = s.route_id and (c.to_school_stop_id = s.id or c.to_home_stop_id = s.id)),
         case when team then
           (select array_agg(c.first_name order by c.first_name) from public.children c
             where c.route_id = s.route_id and (c.to_school_stop_id = s.id or c.to_home_stop_id = s.id))
         else
           (select array_agg(c.first_name order by c.first_name) from public.children c
             where c.parent_id = auth.uid() and c.route_id = s.route_id
               and (c.to_school_stop_id = s.id or c.to_home_stop_id = s.id))
         end
    from public.route_stops s
   where s.route_id = p_route_id;
end $$;

grant execute on function public.route_map(uuid) to authenticated;

-- School names for search suggestions. Names only: no routes, codes or addresses.
create or replace function public.known_schools() returns table (school_name text)
language sql stable security definer set search_path = public as $$
  select distinct r.school_name
    from public.routes r
    join public.drivers d on d.id = r.owner_id
   where d.verification_status = 'VERIFIED'
   order by 1;
$$;

grant execute on function public.known_schools() to authenticated;
