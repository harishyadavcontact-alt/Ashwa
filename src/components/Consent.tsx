import { Link } from 'react-router-dom';

// Plain-language consent. Parents must tick this before their child's details are stored.
export function Consent({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check consent">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        I am this child’s parent or guardian. I agree that Ashwa stores my name, mobile number, my child’s first name, school, and
        pickup and drop points, and shows the van’s location to me and my driver during trips. I can delete my data at any time.{' '}
        <Link to="/privacy">Read the privacy notice</Link>.
      </span>
    </label>
  );
}
