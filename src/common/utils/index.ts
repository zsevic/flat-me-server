export function capitalizeWords(words: string): string {
  return words
    .split(' ')
    .filter(word => word.length !== 0)
    .map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
    .join(' ');
}

export function getUniqueValuesQuery(fieldName: string) {
  return {
    $reduce: {
      input: fieldName,
      initialValue: [],
      in: {
        $let: {
          vars: { elem: { $concatArrays: ['$$this', '$$value'] } },
          in: { $setUnion: '$$elem' },
        },
      },
    },
  };
}

export function isEnvironment(environment: string): boolean {
  return process.env.NODE_ENV === environment;
}
