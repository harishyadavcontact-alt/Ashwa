import { Link } from 'react-router-dom';

// One line, plain words. Full wording lives in the privacy notice.
export function Consent({ checked, onChange, role }: { checked: boolean; onChange: (v: boolean) => void; role: 'parent' | 'driver' }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {role === 'parent'
          ? 'I agree that my child’s details are used only for their van. '
          : 'I will keep my customers’ details private. '}
        <Link to="/privacy">Privacy</Link>
      </span>
    </label>
  );
}
