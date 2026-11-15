import { useState } from 'react';
import type { Point } from '../data/types';

// A named map point: a label plus latitude and longitude, with "use my location".
// Emits a Point once both coordinates are valid numbers, otherwise null.
export function PointInput({
  label,
  value,
  onChange,
  namePlaceholder = 'Name it (e.g. Gate 2)',
  defaultName = 'Point',
}: {
  label: string;
  value: Point | null;
  onChange: (p: Point | null) => void;
  namePlaceholder?: string;
  defaultName?: string;
}) {
  const [name, setName] = useState(value?.label ?? '');
  const [lat, setLat] = useState(value ? String(value.lat) : '');
  const [lng, setLng] = useState(value ? String(value.lng) : '');
  const [geoError, setGeoError] = useState<string | null>(null);

  function emit(nextName: string, nextLat: string, nextLng: string) {
    const a = Number(nextLat);
    const b = Number(nextLng);
    if (!nextLat.trim() || !nextLng.trim() || Number.isNaN(a) || Number.isNaN(b) || a < -90 || a > 90 || b < -180 || b > 180) {
      onChange(null);
      return;
    }
    onChange({ lat: a, lng: b, label: nextName.trim() || defaultName });
  }

  function useMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('This phone cannot share location. Type the coordinates.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const la = p.coords.latitude.toFixed(6);
        const ln = p.coords.longitude.toFixed(6);
        setLat(la);
        setLng(ln);
        emit(name, la, ln);
      },
      () => setGeoError('Location blocked. Allow it, or type the coordinates.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <fieldset className="point">
      <legend>{label}</legend>
      <input
        aria-label={`${label} name`}
        placeholder={namePlaceholder}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          emit(e.target.value, lat, lng);
        }}
      />
      <div className="row">
        <input
          aria-label={`${label} latitude`}
          inputMode="decimal"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => {
            setLat(e.target.value);
            emit(name, e.target.value, lng);
          }}
        />
        <input
          aria-label={`${label} longitude`}
          inputMode="decimal"
          placeholder="Longitude"
          value={lng}
          onChange={(e) => {
            setLng(e.target.value);
            emit(name, lat, e.target.value);
          }}
        />
      </div>
      <button type="button" onClick={useMyLocation}>
        Use my location
      </button>
      {geoError && (
        <p role="alert" className="error">
          {geoError}
        </p>
      )}
    </fieldset>
  );
}
