export function capitalizeWords(words: string): string {
  if (!words) return;

  return words
    .split(' ')
    .filter(word => word.length !== 0)
    .map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
    .join(' ')
    .split('(')
    .filter(word => word.length !== 0)
    .map(word => {
      const { length: wordLength } = word;
      if (wordLength === 1) return word.toUpperCase();

      const firstLetter = word[0].toUpperCase();
      const isWithClosedBracket = word.lastIndexOf(')') === wordLength - 1;
      const lastLetterIndex = isWithClosedBracket ? wordLength - 1 : wordLength;
      return (firstLetter + word.substring(1, lastLetterIndex)).trim();
    })
    .join(' - ');
}

export function isEnvironment(environment: string): boolean {
  return process.env.NODE_ENV === environment;
}
