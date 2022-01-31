export function capitalizeWords(words: string): string {
  if (!words) return;

  return words
    .split(' ')
    .filter(word => word.length !== 0)
    .map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
    .join(' ');
}

export function isEnvironment(environment: string): boolean {
  return process.env.NODE_ENV === environment;
}
