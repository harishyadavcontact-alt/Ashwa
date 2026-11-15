// Sends a web push to parents when a trip event is recorded for their child.
// NOT YET DEPLOYED OR TESTED. Needs: VAPID keys (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT),
// a Supabase database webhook on public.trip_events (INSERT) pointing here, and the migration applied.
//
// Message copy matches src/logic/alerts.ts (parentMessage).
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const EVENT_COPY: Record<string, string> = {
  DRIVER_AT_PICKUP: 'The van has reached {pickup}.',
  CHILD_BOARDED: '{child} is on the van.',
  DRIVER_AT_SCHOOL: 'The van has reached {school}.',
  DRIVER_LEFT_SCHOOL: 'The van has left {school} for home.',
  DRIVER_AT_DROP: 'The van has reached {drop}.',
  CHILD_DROPPED: '{child} has been dropped off.',
};

Deno.serve(async (req) => {
  const body = await req.json();
  const record = body.record as { trip_id: string; child_id: string; event_type: string };
  if (!record || !EVENT_COPY[record.event_type]) return new Response('ignored', { status: 200 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:ops@example.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const { data: child } = await admin.from('children').select('id, first_name, school_name, parent_id').eq('id', record.child_id).single();
  const { data: trip } = await admin.from('trips').select('route_id').eq('id', record.trip_id).single();
  if (!child || !trip) return new Response('no data', { status: 200 });

  // Parents of this child get the child's own events. School events go to every parent on the run.
  const schoolEvent = record.event_type.startsWith('DRIVER_AT_SCHOOL') || record.event_type === 'DRIVER_LEFT_SCHOOL';
  const { data: parents } = schoolEvent
    ? await admin.from('children').select('parent_id').eq('route_id', trip.route_id).not('parent_id', 'is', null)
    : { data: [{ parent_id: child.parent_id }] };
  const parentIds = [...new Set((parents ?? []).map((p) => p.parent_id as string))];

  const text = EVENT_COPY[record.event_type]
    .replace('{child}', child.first_name)
    .replace('{school}', child.school_name)
    .replace('{pickup}', 'the pickup point')
    .replace('{drop}', 'the drop point');

  const { data: subs } = await admin.from('push_subscriptions').select('endpoint, keys').in('user_id', parentIds);
  let sent = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify({ title: 'Ashwa', body: text, url: '/parent', tag: record.trip_id }));
      sent++;
    } catch {
      // Expired subscriptions are ignored; the parent re-enables alerts from the account screen.
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'content-type': 'application/json' } });
});
