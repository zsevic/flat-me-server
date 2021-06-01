export function getLocation({ latitude, longitude }): string {
  return `http://www.google.com/maps/place/${latitude},${longitude}`;
}
