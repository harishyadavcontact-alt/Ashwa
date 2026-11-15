import { describe, expect, it } from 'vitest';
import { isVisibleToChild, parentMessage, timelineFor, unseenFor } from './alerts';

const child = { firstName: 'Asha', schoolName: 'Sunrise School', pickupLabel: 'Gate 2', dropLabel: 'Home' };

describe('visibility', () => {
  it('shows a child their own events', () => {
    expect(isVisibleToChild({ childId: 'a', eventType: 'CHILD_BOARDED', createdAt: '' }, 'a')).toBe(true);
  });

  it('hides other children’s pickups and boardings', () => {
    expect(isVisibleToChild({ childId: 'b', eventType: 'CHILD_BOARDED', createdAt: '' }, 'a')).toBe(false);
    expect(isVisibleToChild({ childId: 'b', eventType: 'DRIVER_AT_PICKUP', createdAt: '' }, 'a')).toBe(false);
  });

  it('shares school arrival and departure with every child on the run', () => {
    expect(isVisibleToChild({ childId: 'b', eventType: 'DRIVER_AT_SCHOOL', createdAt: '' }, 'a')).toBe(true);
    expect(isVisibleToChild({ childId: 'b', eventType: 'DRIVER_LEFT_SCHOOL', createdAt: '' }, 'a')).toBe(true);
  });
});

describe('messages', () => {
  it('names the child and place in plain language', () => {
    expect(parentMessage('CHILD_BOARDED', child)).toBe('Asha is on the van.');
    expect(parentMessage('DRIVER_AT_SCHOOL', child)).toBe('The van has reached Sunrise School.');
    expect(parentMessage('CHILD_DROPPED', child)).toBe('Asha has been dropped off.');
  });
});

describe('timeline and unseen events', () => {
  const events = [
    { id: '2', childId: 'a', eventType: 'CHILD_BOARDED' as const, createdAt: '2026-11-16T07:40:00Z' },
    { id: '1', childId: 'a', eventType: 'DRIVER_AT_PICKUP' as const, createdAt: '2026-11-16T07:35:00Z' },
    { id: '3', childId: 'b', eventType: 'CHILD_BOARDED' as const, createdAt: '2026-11-16T07:41:00Z' },
    { id: '4', childId: 'b', eventType: 'DRIVER_AT_SCHOOL' as const, createdAt: '2026-11-16T08:00:00Z' },
  ];

  it('returns the child’s timeline oldest first', () => {
    expect(timelineFor(events, 'a').map((e) => e.id)).toEqual(['1', '2', '4']);
  });

  it('returns only events not yet seen', () => {
    expect(unseenFor(events, 'a', new Set(['1'])).map((e) => e.id)).toEqual(['2', '4']);
  });
});
