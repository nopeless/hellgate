import { assert } from "tsafe";
import { isPromise } from "util/types";

/**
 * Ring methods
 */
type __Ring_Parent<R> = R extends Ring<infer T> ? T : never;
type __Ring_Perms<R> = R extends Ring<any, infer T> ? T : never;
type __Ring_Opts<R> = R extends Ring<any, any, infer T> ? T : never;

/**
 * Hellgate methods
 */
type __Hellgate_Opts<R> = R extends Hellgate<infer T> ? T : never;
type __Hellgate_Perms<R> = R extends Hellgate<any, infer T> ? T : never;

// TODO: write one for Permissions as well
function override<R extends Ring>(
  this: R,
  permRes: PermissionResolver
): PermissionResolverFunction {
  const f =
    typeof permRes === `boolean` ? <PermissionResolverFunction>function () {
          return permRes;
        } : permRes.bind(this);
  f.override = true;
  return f;
}

function inherit(
  prototype: Permissions,
  permissions: Permissions
): Permissions {
  return Object.assign(Object.create(prototype), permissions);
}

class Ring<
  Parent extends Ring | Hellgate = any,
  Perms extends Permissions = {},
  Opts extends Partial<Pick<Options, `getSin`>> = {}
> {
  constructor(
    // TODO: work on this
    // public parent: Parent extends Hellgate
    //   ? Parent
    //   : Parent extends Ring
    //   ? Parent
    //   : never,
    public permissions: Perms extends __Permissions_Concrete<Perms>
      ? Perms
      : never = <Perms extends __Permissions_Concrete<Perms> ? Perms : never>{},
    public opts: Opts = <Opts>{}
  ) {
    //
  }
}

/**
 * TypeScript hack to know the type of the function without having to execute the function twice using
 * reference objects
 */
function executeAndAssertIfAsync(
  func: (...args: any[]) => any,
  ref: { return: any }
): func is (...args: any[]) => Promise<any> {
  const p = func();
  // Reference hack
  ref.return = p;
  if (isPromise(p)) {
    return true;
  }
  return false;
}

class Hellgate<
  Opts extends Options = Options,
  Perms extends Permissions<any, __Options_User<Opts>> = {}
> {
  public readonly parent = null;

  /**
   * If you get a type error here, it means that you have not provided the correct type
   */
  constructor(
    // Concrete defaults that return `never` when invalid types are provided
    public options: Opts extends __Options_Concrete<Opts>
      ? // I really don't see a way around this. If you know a simpler way, let me know
        Opts extends Options<infer _1, infer _2, infer _3, infer _4>
        ? Options<_1, _2, _3, _4, Hellgate<Opts, Perms>>
        : never
      : never,
    public permissions: Perms extends __Permissions_Concrete<Perms>
      ? Perms
      : never = <Perms extends __Permissions_Concrete<Perms> ? Perms : never>{}
  ) {}

  // This overload is for bypassing the type system while providing definite types
  // As of TypeScript 4.8.2, not using an overload signature results in messy types
  can(
    user: __Options_UserParsable<Opts>,
    perm: keyof Perms,
    ...args: Perms[typeof perm] extends PermissionResolverFunction
      ? __PermissionResolverFunction_getRestArgs<Perms[typeof perm]>
      : never
  ): IsNever<
    Exclude<Perms[typeof perm], boolean>,
    Perms[typeof perm],
    // This "redundancy" is required as undefined values are moved to null here
    __Permissions_isPermissionAsync<
      Perms,
      typeof perm,
      Promise<boolean | null>,
      __Options_AnyAsync<Opts, Promise<boolean | null>, boolean | null>
    >
  >;
  /**
   * Either synchronously or asynchronously returns whether the user has permission
   */
  can(
    user: __Options_UserParsable<Opts>,
    perm: keyof Perms,
    ...args: Perms[typeof perm] extends PermissionResolverFunction
      ? __PermissionResolverFunction_getRestArgs<Perms[typeof perm]>
      : never
  ) {
    if (!(perm in this.permissions)) {
      // This line should never be reached unless dynamic untyped permissions are used
      // in which case it is impossible to know the type anyway
      // This guard exists to help JS users
      return null as any;
    }

    const r = this.permissions[perm];

    if (typeof r === `boolean`) {
      // This is akin to a synchronous resolution
      return r;
    }

    // From now it is permission resolver function
    // Scope the function
    const exec = <Exclude<Perms[typeof perm], boolean>>(
      (() => r.bind(this)(user, ...args))
    );

    // set a return ref
    const ref = {} as {
      return: Promise<boolean | undefined> | boolean | undefined;
    };

    // Execute the function and get that typecheck
    if (executeAndAssertIfAsync(exec, ref)) {
      // Since it is async, this block expects a promise
      // assert the type
      assert(isPromise(ref.return));

      // now ref.return is Promise<boolean | undefined>
      // However, as of TypeScript 4.8.2, it is not possible to infer this information.
      // Thus, a manual cast is required (bypassed)
      return ref.return.then((r) => {
        if (r === undefined) return null;
        return r;
      });
    }

    // This type is now boolean or undefined
    if (ref.return === undefined) return null;
    return ref.return;
  }
}

export { inherit, override, Hellgate, Ring };
