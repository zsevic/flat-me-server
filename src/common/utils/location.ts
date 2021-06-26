export function getLocationUrl({
  latitude = null,
  longitude = null,
} = {}): string {
  if (!latitude || !longitude) return;

  return `http://www.google.com/maps/place/${latitude},${longitude}`;
}
