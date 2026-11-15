import { Link } from 'react-router-dom';

// Plain-language notice. Review with a lawyer before real families use the app (see strategy/12, blind spot 4).
export default function Privacy() {
  return (
    <main className="shell">
      <p>
        <Link to="/">← Back</Link>
      </p>
      <h1>Privacy notice</h1>
      <p>Last updated: 15 November 2026. Draft for the pilot.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Parents: name and mobile number, used to sign in and to link your children to your driver.</li>
        <li>Children: first name, school, and the pickup and drop points you give. We do not collect photos, dates of birth, or ID numbers.</li>
        <li>Drivers: name, number of seats, and the route you run.</li>
        <li>Trips: the stops your child was picked up and dropped at, and the van’s location while a trip is running.</li>
        <li>Payments: the amount and method you tell us you paid. Ashwa does not process payments in the pilot.</li>
      </ul>

      <h2>Why</h2>
      <p>To show your child’s van and its progress, send you updates about the trip, and record fees between you and your driver.</p>

      <h2>Who can see it</h2>
      <ul>
        <li>You see your own child’s details, trips and payments.</li>
        <li>Your child’s driver (and any replacement driver on the same route) sees the children on their route.</li>
        <li>Other parents never see your child, your number, or your address. On the map they see anonymous stop markers only.</li>
        <li>Ashwa does not sell data and does not show ads.</li>
      </ul>

      <h2>How long</h2>
      <p>Live location is kept only during a trip. Trip records are kept for the fee history. You can delete your data at any time from your parent screen.</p>

      <h2>Your rights</h2>
      <p>You can ask us to show, correct or delete your data. Use the delete button in the app, or contact the Ashwa team.</p>
    </main>
  );
}
