// BASIC TYPES

type Fn = (this: never, ...args: never[]) => unknown;

/**
 * Masks the array with unknown for future intersection
 */
type ElementAt<T extends unknown[], N> = N extends keyof T ? T[N] : unknown;

type U2I<U> = (U extends U ? (arg: U) => 0 : never) extends (arg: infer I) => 0
  ? I
  : never;

// For homogeneous unions, it picks the last member
type OneOf<U> = U2I<U extends U ? (x: U) => 0 : never> extends (x: infer L) => 0
  ? L
  : never;

type U2T<U, L = OneOf<U>> = [U] extends [never]
  ? []
  : [...U2T<Exclude<U, L>>, L];

type IsEqual<X, Y> = (<T>() => T extends X ? true : false) extends <
  T
>() => T extends Y ? true : false
  ? true
  : false;

// INTERMEDIATE TYPES

type IsArray<T extends unknown[]> = IsEqual<T[0][], T>;

type _IsAllNonTupleArrays<T extends unknown[][]> = T extends [
  infer H extends unknown[],
  ...infer R extends unknown[][]
]
  ? IsArray<H> extends true
    ? _IsAllNonTupleArrays<R>
    : false
  : true;

type _MergeNonTupleArrays<T extends unknown[][]> = T extends [
  infer H extends unknown[],
  ...infer R extends unknown[][]
]
  ? H[number] & _MergeNonTupleArrays<R>
  : unknown;

type MergeNonTupleArrays<T extends unknown[][]> = _MergeNonTupleArrays<T>[];

type MergeTuples<T extends unknown[][]> = T extends []
  ? T
  : _IsAllNonTupleArrays<T> extends true
  ? MergeNonTupleArrays<T>
  : [_HeadMerge<T>, ...MergeTuples<_Reduce<T>>];

type ExtractParameters<T extends readonly Fn[]> = {
  [K in keyof T]: Parameters<T[K]>;
} extends infer U extends unknown[][]
  ? U extends [][]
    ? []
    : U
  : never;

type _HeadMerge<T extends unknown[][]> = T extends [
  infer H extends unknown[],
  ...infer R extends unknown[][]
]
  ? ElementAt<H, `0`> & _HeadMerge<R>
  : unknown;

// Will remove the array if it is empty
type _Reduce<T extends unknown[][]> = T extends [
  infer H extends unknown[],
  ...infer R extends unknown[][]
]
  ? H extends [infer _, ...infer Rs extends unknown[]]
    ? Rs extends []
      ? _Reduce<R>
      : [Rs, ..._Reduce<R>]
    : IsArray<H> extends true
    ? [H, ..._Reduce<R>]
    : _Reduce<R>
  : [];

// EXPORTED TYPES

export type MergeParameters<Fs extends Fn[]> = Fs extends []
  ? []
  : `0` extends keyof Fs
  ? MergeTuples<ExtractParameters<Fs>>
  : MergeTuples<
      ExtractParameters<
        U2T<Fs[number]> extends infer Fns extends Fn[] ? Fns : never
      >
    >;

// MERGE

type OptionalPropertyNames<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

type SpreadProperties<L, R, K extends keyof L & keyof R> = {
  [P in K]: L[P] | R[P];
};

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type Merge<L, R> = Id<
  Pick<L, Exclude<keyof L, keyof R>> &
    Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
    Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
    SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

export { Merge };
