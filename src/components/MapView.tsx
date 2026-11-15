import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import type { MapStop, Point } from '../data/types';

// Map-first UI, like a delivery or ride app. OpenStreetMap tiles are free; keep pilot traffic modest.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const BANGALORE: [number, number] = [77.6, 12.95];
const ROUTE_SOURCE = 'route-line';

interface Props {
  stops: MapStop[];
  van?: Point | null;
  pick?: Point | null;
  pickMode?: boolean;
  onPick?: (p: Point) => void;
  highlightFirst?: boolean;
  onStopTap?: (stop: MapStop) => void;
}

// Route line runs start → stops (to school) → school. Pins: school square, van bubble, stops and families.
export function MapView({ stops, van, pick, pickMode = false, onPick, highlightFirst = true, onStopTap }: Props) {
  const tapRef = useRef(onStopTap);
  tapRef.current = onStopTap;
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const staticMarkers = useRef<maplibregl.Marker[]>([]);
  const vanMarker = useRef<maplibregl.Marker | null>(null);
  const pickMarker = useRef<maplibregl.Marker | null>(null);
  const pickModeRef = useRef(pickMode);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pickModeRef.current = pickMode;
    onPickRef.current = onPick;
  }, [pickMode, onPick]);

  // Create the map once.
  useEffect(() => {
    if (!host.current) return;
    const m = new maplibregl.Map({ container: host.current, style: STYLE, center: BANGALORE, zoom: 13, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.on('load', () => {
      m.addSource(ROUTE_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({
        id: ROUTE_SOURCE,
        type: 'line',
        source: ROUTE_SOURCE,
        paint: { 'line-color': '#1a1a1a', 'line-width': 5, 'line-opacity': 0.85 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
      setReady(true);
    });
    m.on('click', (e) => {
      if (pickModeRef.current && onPickRef.current) {
        onPickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng, label: '' });
      }
    });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Pick-mode cursor.
  useEffect(() => {
    const canvas = map.current?.getCanvas();
    if (canvas) canvas.style.cursor = pickMode ? 'crosshair' : '';
  }, [pickMode, ready]);

  // Stops, school and route line. Refit when the set of points changes.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    staticMarkers.current.forEach((x) => x.remove());
    staticMarkers.current = [];

    const toSchool = stops
      .filter((s) => s.kind === 'STOP' && s.direction === 'TO_SCHOOL')
      .sort((a, b) => a.order - b.order);
    const start = stops.find((s) => s.kind === 'START');
    const school = stops.find((s) => s.kind === 'SCHOOL');
    const line = [...(start ? [start.point] : []), ...toSchool.map((s) => s.point), ...(school ? [school.point] : [])];

    stops.forEach((s) => {
      const el = document.createElement('div');
      if (s.kind === 'SCHOOL') {
        el.className = 'pin school';
        el.textContent = 'S';
      } else if (s.kind === 'START') {
        el.className = 'pin start';
        el.textContent = 'V';
      } else if (s.names.length > 0 && highlightFirst) {
        el.className = 'pin mine';
        el.textContent = s.names.join(', ');
      } else {
        el.className = 'pin stop';
        el.textContent = s.childCount > 0 ? String(s.childCount) : '';
      }
      if (s.kind === 'STOP') {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          tapRef.current?.(s);
        });
      }
      staticMarkers.current.push(new maplibregl.Marker({ element: el }).setLngLat([s.point.lng, s.point.lat]).addTo(m));
    });

    const src = m.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    src?.setData({
      type: 'FeatureCollection',
      features: line.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line.map((p) => [p.lng, p.lat]) } }] : [],
    });

    const all = stops.map((s) => [s.point.lng, s.point.lat] as [number, number]);
    if (all.length > 1) {
      const b = new maplibregl.LngLatBounds(all[0], all[0]);
      all.forEach((c) => b.extend(c));
      m.fitBounds(b, { padding: { top: 60, bottom: 220, left: 40, right: 40 }, maxZoom: 15, duration: 400 });
    } else if (all.length === 1) {
      m.jumpTo({ center: all[0], zoom: 14 });
    }
  }, [stops, ready, highlightFirst]);

  // Van position, updated without refitting the map.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    if (!van) {
      vanMarker.current?.remove();
      vanMarker.current = null;
      return;
    }
    if (!vanMarker.current) {
      const el = document.createElement('div');
      el.className = 'pin van';
      el.textContent = '🚐';
      vanMarker.current = new maplibregl.Marker({ element: el }).setLngLat([van.lng, van.lat]).addTo(m);
    } else {
      vanMarker.current.setLngLat([van.lng, van.lat]);
    }
  }, [van, ready]);

  // The point being chosen, shown in red.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    pickMarker.current?.remove();
    pickMarker.current = null;
    if (pick) {
      const el = document.createElement('div');
      el.className = 'pin pick';
      el.textContent = '●';
      pickMarker.current = new maplibregl.Marker({ element: el }).setLngLat([pick.lng, pick.lat]).addTo(m);
    }
  }, [pick, ready]);

  return <div ref={host} className="map" aria-label="Map" />;
}
