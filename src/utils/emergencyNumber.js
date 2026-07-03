// emergencyNumber.js — shared region → emergency phone number mapping.
// Used by DriveHome and SafeWalk emergency overlays so the "Call ___" button
// dials the right number for the user's region instead of a hardcoded 911.
//
// Notes:
// - GB: 999 is the traditional number, but 112 also works there (and across
//   the EU), so we map GB → 112 to keep the map simple and correct.
// - Default is 112 — the GSM-standard emergency number, routed to local
//   emergency services on virtually every mobile network worldwide.

const EMERGENCY_NUMBERS = {
  // North America + countries on the 911 system
  US: '911', CA: '911', MX: '911', PH: '911',
  // EU / EEA / UK — 112 is the pan-European emergency number
  AT: '112', BE: '112', BG: '112', HR: '112', CY: '112', CZ: '112',
  DK: '112', EE: '112', FI: '112', FR: '112', DE: '112', GR: '112',
  HU: '112', IE: '112', IT: '112', LV: '112', LT: '112', LU: '112',
  MT: '112', NL: '112', PL: '112', PT: '112', RO: '112', SK: '112',
  SI: '112', ES: '112', SE: '112', NO: '112', CH: '112', IS: '112',
  GB: '112',
  // Rest of world
  AU: '000',
  NZ: '111',
  JP: '110',
  IN: '112',
  BR: '190',
  CN: '110',
  KR: '112',
  ZA: '10111',
};

export const getEmergencyNumber = (userRegion) => {
  const region = (userRegion || '').trim().toUpperCase();
  return EMERGENCY_NUMBERS[region] || '112';
};
