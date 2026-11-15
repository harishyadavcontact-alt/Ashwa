import { useEffect, useRef, useState } from 'react';
import { extras, INCIDENT_KINDS, todayKey } from '../data/extras';
import { store } from '../data';
import type { ChildRecord, EventRecord, RouteRecord, RouteStop, TripRecord } from '../data/types';
import { track } from '../lib/analytics';
import { buildRunStops } from '../logic/routes';
import { getNextTripAction, validateTripEvent, type EventType, type TripLike, type TripType } from '../logic/tripProgression';

const LOCATION_PUSH_MS = 10_000;

// WhatsApp alert messages for parents at each trip milestone
function getWhatsAppAlertText(eventType: EventType, childName: string): string | null {
  switch (eventType) {
    case 'CHILD_BOARDED':
      return `✓ Picked up ${childName}. On the way to school.`;
    case 'DRIVER_AT_SCHOOL':
      return `✓ ${childName} reached school.`;
    case 'DRIVER_LEFT_SCHOOL':
      return `✓ Left school. ${childName} will be home soon.`;
    case 'CHILD_DROPPED':
      return `✓ ${childName} dropped home. See you tomorrow!`;
    default:
      return null;
  }
}

// Button text for the next thing the driver does. Short, in the driver's words.
export function nextLabel(e: EventType): string {
  switch (e) {
    case 'DRIVER_AT_PICKUP':
      return 'Reached pickup';
    case 'CHILD_BOARDED':
      return 'Picked up';
    case 'DRIVER_AT_SCHOOL':
      return 'Reached school';
    case 'DRIVER_LEFT_SCHOOL':
      return 'Left school';
    case 'DRIVER_AT_DROP':
      return 'Reached drop';
    case 'CHILD_DROPPED':
      return 'Dropped';
    default:
      return e;
  }
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayKey(d);
}

export function RunPanel({ route, stops, children, driverId }: { route: RouteRecord; stops: RouteStop[]; children: ChildRecord[]; driverId: string }) {
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [absentIds, setAbsentIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [gps, setGps] = useState(true);
  const [reporting, setReporting] = useState(false);
  const lastPush = useRef(0);

  useEffect(() => {
    store.getActiveTrip(route.id).then(async (t) => {
      setTrip(t);
      setEvents(t ? await store.listEvents(t.id) : []);
    });
  }, [route.id]);

  useEffect(() => {
    if (children.length === 0) return;
    extras
      .absentChildIds(
        children.map((c) => c.id),
        todayKey(),
      )
      .then(setAbsentIds)
      .catch(() => {});
  }, [children]);

  // Keep the screen on during a run where supported.
  useEffect(() => {
    if (!trip) return;
    let lock: { release: () => Promise<void> } | null = null;
    navigator.wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [trip]);

  // Publish the van's position every 10 seconds during a run.
  useEffect(() => {
    if (!trip || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGps(true);
        const now = Date.now();
        if (now - lastPush.current < LOCATION_PUSH_MS) return;
        lastPush.current = now;
        store.setVanLocation(trip.id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => setGps(false),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [trip]);

  // Children who are coming today. Absent children are left out of the run.
  const riding = children.filter((c) => !absentIds.includes(c.id));

  async function start(tripType: TripType) {
    setMessage(null);
    try {
      const t = await store.startTrip(route.id, driverId, tripType, crypto.randomUUID());
      track('trip_started', { type: tripType, customers: riding.length });
      setTrip(t);
      setEvents([]);
      lastPush.current = 0;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start');
    }
  }

  async function toggleAbsent(childId: string) {
    const nowAbsent = !absentIds.includes(childId);
    setAbsentIds((ids) => (nowAbsent ? [...ids, childId] : ids.filter((x) => x !== childId)));
    try {
      await extras.setAbsent(childId, todayKey(), nowAbsent);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save');
    }
  }

  const tripType: TripType = trip?.tripType ?? 'MORNING';
  const run = trip ? buildRunStops(route, stops, riding, tripType) : [];
  const logicTrip: TripLike = { tripType, stops: run, events: events.map((e) => ({ childId: e.childId, eventType: e.eventType })) };
  const next = trip ? getNextTripAction(logicTrip) : null;
  const nextEvent: EventType | null = next?.allowedEvents[0] ?? null;
  const nextChild = next?.childId ? riding.find((c) => c.id === next.childId) : null;
  const done = run.filter((r) => next?.nextStop && r.sequenceIndex < next.nextStop.sequenceIndex).length;

  async function tap() {
    if (!trip || !next || !nextEvent || !next.childId) return;
    const check = validateTripEvent(logicTrip, next.childId, nextEvent);
    if (!check.ok) return setMessage(check.reason);
    try {
      await store.addEvent({ id: crypto.randomUUID(), tripId: trip.id, childId: next.childId, eventType: nextEvent });
      track('stop_tapped', { event: nextEvent });
      setEvents(await store.listEvents(trip.id));
      setMessage(null);

      // Send WhatsApp alert to parent
      const child = riding.find((c) => c.id === next.childId);
      if (child) {
        const alertMsg = getWhatsAppAlertText(nextEvent, child.firstName);
        if (alertMsg) {
          extras.sendWhatsAppAlert(child.parentPhone, alertMsg, child.firstName).catch(() => {});
        }
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Try again');
    }
  }

  async function report(kind: string) {
    setReporting(false);
    try {
      await extras.reportIncident(route.id, kind, '');
      track('stop_tapped', { event: 'PROBLEM' });
      setMessage('Sent. Ashwa has been told.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not send');
    }
  }

  const problemButton = (
    <div className="stack">
      {!reporting ? (
        <button type="button" className="btn ghost full" onClick={() => setReporting(true)}>
          Report a problem
        </button>
      ) : (
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {INCIDENT_KINDS.map((k) => (
            <button key={k} type="button" onClick={() => report(k)}>
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (!trip) {
    return (
      <div className="stack">
        {children.length > 0 && (
          <section>
            <div className="row between">
              <strong>Today</strong>
              <span className="muted">
                {riding.length} coming · {absentIds.length} absent
              </span>
            </div>
            <ul className="list">
              {children.map((c) => {
                const absent = absentIds.includes(c.id);
                return (
                  <li key={c.id} className="row between">
                    <span className={absent ? 'muted' : ''}>{c.firstName}</span>
                    <button type="button" className={`btn small ${absent ? 'primary' : 'ghost'}`} onClick={() => toggleAbsent(c.id)}>
                      {absent ? 'Absent' : 'Coming'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <button type="button" className="btn primary big full" onClick={() => start('MORNING')} disabled={riding.length === 0}>
          Morning run
        </button>
        <button type="button" className="btn ghost big full" onClick={() => start('AFTERNOON')} disabled={riding.length === 0}>
          Afternoon run
        </button>
        {children.length === 0 && <p className="muted">Add customers first.</p>}
        <button
          type="button"
          className="btn ghost full"
          onClick={async () => {
            try {
              await extras.requestBackup(route.id, tomorrowKey(), '');
              setMessage('Backup asked for tomorrow. Verified drivers nearby will see it.');
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Could not ask');
            }
          }}
        >
          Need a backup tomorrow?
        </button>
        {message && <p className="notice">{message}</p>}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row between">
        <span className="chip brand">{tripType === 'MORNING' ? 'Morning' : 'Afternoon'} run</span>
        <span className="muted">
          {done}/{run.length}
        </span>
      </div>
      <div className="progress">
        <span style={{ width: `${run.length ? (done / run.length) * 100 : 0}%` }} />
      </div>

      {next?.nextStop && nextEvent ? (
        <>
          <p className="run-next">
            {nextChild ? nextChild.firstName : next.nextStop.stopType === 'SCHOOL' ? 'School' : 'Next'} · {next.nextStop.address}
          </p>
          <button type="button" className="btn primary big full" onClick={tap}>
            {nextLabel(nextEvent)}
          </button>
        </>
      ) : (
        <p className="run-next">Run complete</p>
      )}

      {!gps && <p className="notice">Location is off. Allow it and keep this screen on.</p>}
      {message && <p className="error">{message}</p>}
      {problemButton}
      <button
        type="button"
        className="btn ghost full"
        onClick={async () => {
          await store.endTrip(trip.id);
          setTrip(null);
          setEvents([]);
        }}
      >
        End run
      </button>
    </div>
  );
}
