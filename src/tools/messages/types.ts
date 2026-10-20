/**
 * The same keys as `T`, with every string replaced by `string`. Used to make
 * every language define exactly the keys of the Japanese messages.
 */
export type SameStructure<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
      ? SameStructure<T[K]>
      : T[K];
};
