/**
 * Hellgate 16
 */
import assert from "node:assert";
import { isPromise } from "util/types";
import { Merge, MergeParameters } from "../types";

type HasPromiseNoDistribution<T> = (
  T extends Promise<unknown> ? true : false
) extends false
  ? false
  : true;
type MaybePromise<T> = T | Promise<T>;
type Fn = (this: never, ...args: never[]) => unknown;
type P0<F extends Fn> = Parameters<F>[0];

function wrap(
  v: boolean | undefined | (() => MaybePromise<boolean | undefined>)
): () => MaybePromise<boolean | undefined> {
  if (typeof v === `boolean` || v === undefined) {
    return () => v;
  }
  return v;
}

function isObject(v: unknown): v is object {
  return Object(v) === v;
}

function then(
  f: () => MaybePromise<boolean | undefined>,
  g: (v: boolean | undefined) => MaybePromise<boolean | undefined>
): () => MaybePromise<boolean | undefined> {
  return () => {
    const v = f();
    if (isPromise(v)) {
      return v.then(g);
    }
    return g(v);
  };
}

// type Merge<A, B> = { [K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never };
type InquiryResult = {
  damned: Record<string, unknown> | null;
  // Deferred values if there is a function call involved
  value: () => MaybePromise<boolean | undefined>;
  processed: boolean;
  final?: boolean | undefined;
};

type PermissionFunctionProperties<V extends boolean | undefined> = {
  /** Function properties
   * Override can overturn a parent's decision
   */
  override?: boolean;
  /** Final means that the return value cannot be overridden
   * It does NOT mean that it can overturn a parent's decision
   */
  final?: boolean;
  /** If the function returns a constant value
   * This can also be a getter, as long as it returns a consistent value
   * If it is a getter, then it should return the same value as if the
   * function was called
   *
   * Used to mark final booleans
   */
  value?: V;
};

type PermissionFunction<
  This = never,
  User extends Record<string, unknown> = never,
  Meta extends unknown[] = never[]
> = ((
  this: This,
  user: User | null,
  action: string,
  ...meta: Meta
) => MaybePromise<boolean | undefined>) &
  PermissionFunctionProperties<boolean | undefined>;

// Mapper function
type _PermissionsAddFunctionProperties<Perms extends Permissions> = [
  keyof Perms
] extends [never]
  ? Perms
  : {
      [K in keyof Perms]: Perms[K] extends ((
        ...args: never[]
      ) => infer R extends MaybePromise<boolean | undefined>)
        ? Perms[K] & PermissionFunctionProperties<Awaited<R>>
        : // Ideally the below this should never happen
          Perms[K];
    };

type Permission<This = never, User extends Record<string, unknown> = never> =
  | undefined
  | boolean
  | PermissionFunction<This, User>;

type PermissionWide<
  This = never,
  User extends Record<string, unknown> = never
> = undefined | boolean | PermissionFunction<This, User, unknown[]>;

type Permissions<
  This = never,
  User extends Record<string, unknown> = never
> = Record<string, Permission<This, User>>;

type PermissionsWide<
  This = never,
  User extends Record<string, unknown> = never
> = Record<string, PermissionWide<This, User>>;

// Extract meta and create new function
type _PermissionMetaArgumentsFunction<F extends PermissionFunction> =
  F extends (
    u: never,
    a: never,
    ...meta: infer Meta extends unknown[]
  ) => unknown
    ? (...args: Meta) => unknown
    : never;

type MetaFunction<P extends Permission> = _PermissionMetaArgumentsFunction<
  Extract<P, PermissionFunction>
>;

type AggregatePermissions<
  // User is an invariant; therefore any is needed
  R extends IRing<any>,
  A extends string
> = R[`__TYPE_Real`] extends true
  ? R[`permissions`] extends infer P
    ? // First, get permission of current
      | (A extends keyof P
            ? P[A] extends infer F
              ? F extends boolean
                ? F
                : F extends (...args: never[]) => infer R
                ? R
                : never
              : never
            : never)
        | (R[`parent`] extends IRing<any>
            ? AggregatePermissions<R[`parent`], A>
            : never)
    : never
  : never;

type AggregatePermissionKeys<
  // User is an invariant; therefore any is needed
  R extends IRing<any>
> = R[`__TYPE_Real`] extends true
  ? R[`permissions`] extends infer P
    ? // First, get permission of current
      | keyof P
        | (R[`parent`] extends IRing<any>
            ? AggregatePermissionKeys<R[`parent`]>
            : never)
    : never
  : never;

type ArrayOfPermissionFunctions<
  // User is an invariant; therefore any is needed
  R extends IRing<any>,
  A extends string
> = R[`__TYPE_Real`] extends true
  ? R[`permissions`] extends infer P
    ? // First, get permission of current
      R[`parent`] extends infer Pa extends IRing<any>
      ? [
          ...ArrayOfPermissionFunctions<Pa, A>,
          ...(A extends keyof P
            ? [MetaFunction<Extract<P[A], PermissionFunction>>]
            : [])
        ]
      : A extends keyof P
      ? [MetaFunction<Extract<P[A], PermissionFunction>>]
      : []
    : []
  : [];

type MetaParameters<
  // User is an invariant; therefore any is needed
  R extends IRing<any>,
  A extends string
> = MergeParameters<ArrayOfPermissionFunctions<R, A>>;

interface IRing<User extends Record<string, unknown>, UserResolvable = never> {
  parent: IRing<User, UserResolvable> | null;
  __TYPE_Real: boolean;
  __TYPE_User: User;
  __TYPE_UserResolvable: (user: UserResolvable) => unknown;
  __TYPE_Damned: Record<string, unknown>;
  permissions: Permissions;
  inquire(
    user: UserResolvable | User | null,
    // action should always be at least a string
    // overloaded later
    action: string,
    // I am not entirely sure how to type this
    ...meta: any
  ): InquiryResult;
  damn(damned: Record<string, unknown> | null): Record<string, unknown>;
  summon(damned: User): Record<string, unknown>;
  getUser(user: UserResolvable): MaybePromise<User | null>;
  exists(action: string): boolean;
  can(
    user: User | null,
    action: string,
    ...meta: any
  ): MaybePromise<boolean | undefined>;
}

type HellgateOptions<
  User extends Record<string, unknown>,
  UserResolvable,
  Sin extends Record<string, unknown>
> = {
  getUser(user: UserResolvable | User): MaybePromise<User | null>;
  getSin?(user: User): Sin;
  damn?(user: User, sin: Record<string, unknown>): Merge<User, Sin>;
  final?: boolean;
};

type RingOptions<
  User extends Record<string, unknown> = never,
  Sin extends Record<string, unknown> = Record<string, unknown>
> = {
  getSin?(damned: User): Sin;
  final?: boolean;
  override?: boolean;
};

class Hellgate<
  OptionsLiteral extends HellgateOptions<User, any, Sin>,
  User extends Record<string, unknown>,
  UserResolvable,
  Sin extends Record<string, unknown> = {},
  Perms extends Permissions<
    IRing<User, UserResolvable>,
    Merge<User, Sin>
  > = Permissions<IRing<User, UserResolvable>, Merge<User, Sin>>
> implements IRing<User, UserResolvable>
{
  __TYPE_Real!: true;
  __TYPE_User!: User;
  __TYPE_Damned!: Merge<User, Sin>;
  __TYPE_UserResolvable!: (user: UserResolvable) => unknown;

  get parent() {
    return null;
  }

  constructor(
    public options: OptionsLiteral & HellgateOptions<User, UserResolvable, Sin>,
    public permissions: _PermissionsAddFunctionProperties<Perms> = {} as _PermissionsAddFunctionProperties<Perms>
  ) {
    //
  }

  public exists<K extends string>(
    action: K
  ): action is K & keyof this[`permissions`] {
    return Object.hasOwn(this.permissions, action);
  }

  public can<K extends AggregatePermissionKeys<this>>(
    user: User | null,
    action: K,
    ...meta: MetaParameters<this, K>
  ): AggregatePermissions<this, K>;
  public can<K extends AggregatePermissionKeys<this>>(
    user: P0<OptionsLiteral[`getUser`]> | User | null,
    action: K,
    ...meta: MetaParameters<this, K>
  ): HasPromiseNoDistribution<
    ReturnType<OptionsLiteral[`getUser`]>
  > extends true
    ? MaybePromise<Awaited<AggregatePermissions<this, K>>>
    : AggregatePermissions<this, K>;
  public can(
    user: P0<OptionsLiteral[`getUser`]>,
    action: string,
    ...meta: any
  ): MaybePromise<boolean | undefined> {
    const u = this.options.getUser(user);
    if (isPromise(u)) {
      return u.then((u) => this.inquire(u, action, ...meta).value());
    }
    return this.inquire(u, action, ...meta).value();
  }

  public inquire(
    cleanUser: User | null,
    action: string,
    ...meta: any
  ): InquiryResult {
    const user = cleanUser === null ? null : this.damn(cleanUser);

    if (!Object.hasOwn(this.permissions, action)) {
      // Permission does not exist
      return {
        damned: user,
        value: () => undefined,
        processed: false,
      };
    }

    const permission = this.permissions[action];
    let final: boolean | undefined;
    let value: () => MaybePromise<boolean | undefined>;
    if (typeof permission === `function`) {
      final = permission.final ?? this.options.final;
      if (Object.hasOwn(permission, `value`)) {
        value = wrap(permission.value);
      } else {
        value = () => permission.bind(this)(user, action, ...(meta as never[]));
      }
    } else {
      value = () => permission;
    }

    return {
      damned: user,
      value,
      processed: true,
      final,
    };
  }
  public damn(user: User): Merge<User, Sin> {
    const sin = this.options.getSin?.(user) ?? ({} as Sin);

    const u: typeof user = { ...user };
    Reflect.setPrototypeOf(u, Object.getPrototypeOf(user));

    Object.assign(u, sin);

    return u as Record<string, unknown> as Merge<User, Sin>;
  }

  public get getUser(): OptionsLiteral[`getUser`] {
    return (u: User) => {
      const r = this.options.getUser(u);

      if (isPromise(r)) {
        return r.then((v) => {
          // Assert that it is object
          assert(
            v === null || isObject(v),
            `Hellgate.getUser must return a MaybePromise<User | null>. Return resolved to ${v}`
          );

          return v;
        });
      }

      assert(
        r === null || isObject(r),
        `Hellgate.getUser must return a MaybePromise<User | null>. Returned ${r}`
      );
      return r;
    };
  }

  /**
   * Summons a user to the current location
   */
  public summon(user: User) {
    return this.damn(user);
  }
}

class Ring<
  // Invariant infer
  Parent extends IRing<any>,
  Sin extends Record<string, unknown> = {},
  Perms extends Permissions<
    IRing<Parent[`__TYPE_User`], P0<Parent[`__TYPE_UserResolvable`]>>,
    Merge<Parent[`__TYPE_Damned`], Sin>
  > = PermissionsWide<
    IRing<Parent[`__TYPE_User`], P0<Parent[`__TYPE_UserResolvable`]>>,
    Merge<Parent[`__TYPE_Damned`], Sin>
  >
> implements IRing<Parent[`__TYPE_User`], P0<Parent[`__TYPE_UserResolvable`]>>
{
  __TYPE_Real!: true;
  __TYPE_User!: Parent[`__TYPE_User`];
  __TYPE_Damned!: Merge<Parent[`__TYPE_Damned`], Sin>;
  __TYPE_UserResolvable!: Parent[`__TYPE_UserResolvable`];

  constructor(
    public parent: Parent,
    public options: RingOptions<Parent[`__TYPE_Damned`], Sin> = {},
    // Desirable type inference behavior for permissions
    public permissions: _PermissionsAddFunctionProperties<Perms> = {} as _PermissionsAddFunctionProperties<Perms>
  ) {
    //
  }

  public exists<K extends string>(
    action: K
  ): action is K & AggregatePermissionKeys<this> {
    return (
      Object.hasOwn(this.permissions, action) || this.parent.exists(action)
    );
  }

  public get getUser() {
    return this.parent.getUser;
  }

  public damn(
    damned: Record<string, unknown>
  ): Merge<Parent[`__TYPE_Damned`], Sin> {
    const sin = this.options.getSin?.(damned) ?? ({} as Sin);

    Object.assign(damned, sin);

    return damned as Record<string, unknown> as Merge<
      Parent[`__TYPE_Damned`],
      Sin
    >;
  }

  public can<K extends AggregatePermissionKeys<this>>(
    user: Parent[`__TYPE_User`] | null,
    action: K,
    ...meta: MetaParameters<this, K>
  ): AggregatePermissions<this, K>;
  public can<K extends AggregatePermissionKeys<this>>(
    user: P0<Parent[`getUser`]> | Parent[`getUser`] | null,
    action: K,
    ...meta: MetaParameters<this, K>
  ): HasPromiseNoDistribution<ReturnType<Parent[`getUser`]>> extends true
    ? MaybePromise<Awaited<AggregatePermissions<this, K>>>
    : AggregatePermissions<this, K>;
  public can(
    user: P0<Parent[`getUser`]>,
    action: string,
    ...meta: any
  ): MaybePromise<boolean | undefined> {
    const u = this.parent.getUser(user) as MaybePromise<
      Parent[`__TYPE_User`] | null
    >;
    if (isPromise(u)) {
      return u.then((u) => this.inquire(u, action, ...meta).value());
    }
    return this.inquire(u, action, ...meta).value();
  }

  public inquire(
    cleanUser: Parent[`__TYPE_User`] | null,
    action: string,
    ...meta: any
  ): InquiryResult {
    const res = this.parent.inquire(cleanUser, action, ...meta);

    // Respect parent's final decision
    if (res.final) {
      return res;
    }

    const user = res.damned === null ? null : this.damn(res.damned);

    if (!Object.hasOwn(this.permissions, action)) {
      return {
        damned: user,
        value: res.value,
        processed: res.processed,
      };
    }

    const permission = this.permissions[action];
    let value: () => MaybePromise<boolean | undefined>;
    let override: boolean | undefined = false;
    let final: boolean | undefined;

    if (typeof permission === `function`) {
      override = permission.override ?? this.options.override;
      final = permission.final ?? this.options.final;
      if (Object.hasOwn(permission, `value`)) {
        value = wrap(permission.value);
      } else {
        value = () => permission.bind(this)(user, action, ...(meta as never[]));
      }
    } else {
      value = () => permission;
    }

    return {
      damned: user,
      value: then(value, (v) => {
        if (override) {
          return v;
        }

        if (v === false) {
          return false;
        } else if (v === true) {
          return res.value() ?? true;
        } else {
          return res.value();
        }
      }),
      final,
      processed: true,
    };
  }

  /**
   * Summons a user to the current location
   */
  public summon(user: Parent[`__TYPE_User`]) {
    return this.damn(this.parent.summon(user));
  }
}

export { Hellgate, Ring };
export type {
  IRing,
  Permission,
  PermissionFunction,
  PermissionFunctionProperties,
  MetaFunction,
};
