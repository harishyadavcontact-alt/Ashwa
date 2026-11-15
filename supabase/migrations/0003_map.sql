-- Ashwa pilot schema v2.2: map data for drivers and parents.
-- The team (route owner or joined driver) sees every stop with the names of the children there.
-- A parent sees the school, the stops, how many children use each stop, and only THEIR OWN children's names.
-- Other families are never shown, not even by name.

create or replace function public.route_map(p_route_id uuid)
returns table (
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
  select 'START'::text, null::text, 0, r.start_lat, r.start_lng, r.start_label, 0, null::text[]
    from public.routes r
   where r.id = p_route_id and team

  union all

  select 'SCHOOL'::text, null::text, 0, r.school_lat, r.school_lng, r.school_name, 0, null::text[]
    from public.routes r
   where r.id = p_route_id

  union all

  select 'STOP'::text, s.direction, s.stop_order, s.lat, s.lng, s.label,
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
