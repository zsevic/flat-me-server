export function capitalizeWords(words: string): string {
  return words
    .split(' ')
    .filter(word => word.length !== 0)
    .map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
    .join(' ');
}

export function separateWords(words: string): string {
  const separatedWords = words.replace(/([A-Z])/g, ' $1');
  return separatedWords
    .split(' ')
    .filter(word => word.length !== 0)
    .map(word => word.toLowerCase())
    .join(' ');
}
