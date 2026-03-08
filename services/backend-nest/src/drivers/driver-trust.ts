type DriverTrustInput = {
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  serviceArea?: string | null;
  baseLat?: number | null;
  baseLng?: number | null;
  licenseDocUrl?: string | null;
  vehicleRegDocUrl?: string | null;
  idProofUrl?: string | null;
  vehiclePhotoUrl?: string | null;
  vehicle?: { makeModel?: string | null; seatsCapacity?: number | null } | null;
  institutions?: Array<unknown> | null;
};

export function summarizeDriverTrust(profile: DriverTrustInput) {
  const missingItems: string[] = [];

  if (!profile.licenseDocUrl) missingItems.push('license document');
  if (!profile.vehicleRegDocUrl) missingItems.push('vehicle registration');
  if (!profile.idProofUrl) missingItems.push('identity proof');
  if (!profile.vehiclePhotoUrl) missingItems.push('vehicle photo');
  if (!profile.serviceArea) missingItems.push('service area');
  if (profile.baseLat == null || profile.baseLng == null) missingItems.push('base location');
  if (!profile.vehicle?.makeModel || !profile.vehicle?.seatsCapacity) missingItems.push('vehicle profile');
  if (!profile.institutions?.length) missingItems.push('institution coverage');

  const isDocumentationComplete = !missingItems.some((item) =>
    ['license document', 'vehicle registration', 'identity proof', 'vehicle photo'].includes(item),
  );
  const isServiceConfigured = !missingItems.some((item) =>
    ['service area', 'base location', 'vehicle profile', 'institution coverage'].includes(item),
  );
  const isServiceReady =
    profile.verificationStatus === 'VERIFIED' && isDocumentationComplete && isServiceConfigured;
  const isParentVisible = isServiceReady;

  const nextAdminAction =
    profile.verificationStatus === 'SUSPENDED'
      ? 'Review suspension'
      : profile.verificationStatus === 'REJECTED'
        ? 'Review rejection'
        : profile.verificationStatus === 'VERIFIED'
          ? isServiceReady
            ? 'Monitor live service'
            : 'Fix profile gaps'
          : missingItems.length
            ? 'Request missing info'
            : 'Verify driver';

  return {
    verificationStatus: profile.verificationStatus,
    isDocumentationComplete,
    isServiceConfigured,
    isServiceReady,
    isParentVisible,
    missingItems,
    nextAdminAction,
  };
}
