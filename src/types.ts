type MaybePromise<T> = T | Promise<T>;

type Unpromised<T> = T extends Promise<infer U> ? Unpromised<U> : T;

type IsNever<T, Y = true, N = false> = [T] extends [never] ? Y : N;

/**
 * Options
 */

type Options<
  UP = any,
  U = any,
  Sin extends Record<string, any> = Record<string, any>,
  Status = any,
  R = any
> = {
  parseUser: (this: R, user: UP) => MaybePromise<U | null>;
  getStatuses: (this: R, user: U) => MaybePromise<Status[]>;
  getSin: (this: R, user: U) => MaybePromise<Sin>;
};

type __Options_Concrete<T> = T extends Options<
  infer _1,
  infer _2,
  infer _3,
  infer _4,
  infer _5
>
  ? IsNever<_1> extends true
    ? never
    : IsNever<_2> extends true
    ? never
    : IsNever<_3> extends true
    ? never
    : IsNever<_4> extends true
    ? never
    : IsNever<_5> extends true
    ? never
    : Options<_1, _2, _3, _4, _5>
  : never;

type __Function_isAsync<
  T extends (...args: any[]) => any,
  Y = true,
  N = false
> = T extends (...args: any[]) => Promise<any> ? Y : N;

type __Options_AnyAsync<
  Opts extends Options,
  Y = true,
  N = false
> = __Function_isAsync<
  Opts[`parseUser`],
  Y,
  __Function_isAsync<
    Opts[`getStatuses`],
    Y,
    __Function_isAsync<Opts[`getSin`], Y, N>
  >
>;

type __Options_UserParsable<T> = T extends Options<infer R> ? R : never;
type __Options_User<T> = T extends Options<any, infer R> ? R : never;
type __Options_Sin<T> = T extends Options<any, any, infer R> ? R : never;
type __Options_Status<T> = T extends Options<any, any, any, infer R>
  ? R
  : never;

/**
 * Permissions
 */

type __PermissionResolverFunctionObject = {
  // I'm not sure what setting it to false will do atm
  // So for now it stays only true or undefined
  override?: true;
};

type PermissionResolverFunction<
  Ring = any,
  U = any
> = __PermissionResolverFunctionObject &
  ((
    this: Ring,
    user?: U,
    ...args: any[]
  ) => MaybePromise<boolean | undefined | null>);

type __PermissionResolverFunction_getRestArgs<
  F extends PermissionResolverFunction
> = F extends (this: any, user: any, ...args: infer R) => any ? R : never;

type PermissionResolver<Ring = any, U = any> =
  | boolean
  | PermissionResolverFunction<Ring, U>;

type Permissions<Ring = any, U = any> = {
  [key: string]: PermissionResolver<Ring, U>;
};

type __Permissions_Concrete<T> = T extends Permissions<infer _1, infer _2>
  ? Permissions<_1, _2>
  : never;

/**
 * If P's S is not a concrete return, return the no boolean counter part (exclude)
 */
type __Permissions_isPermissionAsync<
  P extends Permissions,
  S extends keyof P,
  Y = true,
  N = false
> = IsNever<
  Exclude<P[S], boolean>,
  N,
  __Function_isAsync<Exclude<P[S], boolean>, Y, N>
>;
