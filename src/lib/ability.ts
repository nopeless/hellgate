// Converts permissison based authorization to
// User based authorization

// TODO add notation support (e.g. *)
// TODO add proxy option (if not found, throw for example or explicitly return false)

function invertBoolean(b: boolean | undefined): boolean | undefined {
  return b === undefined ? undefined : !b;
}

type Bfn<U extends Record<string, unknown>> = (u: U) => boolean | undefined;

function wrap<U extends Record<string, unknown>>(
  f: Bfn<U> | boolean | undefined
): Bfn<U> {
  if (typeof f === `function`) {
    return f;
  }
  return () => f;
}

class ProxyUser<
  User extends Record<string, unknown> = Record<string, unknown>,
  Action extends string = string,
  Resource extends string = string
> {
  /**
   * Record<action, Record<resource, [condition extends Fn]>>
   */
  public permissionBucket: Record<string, Record<string, Bfn<User>[]>> =
    Object.create(null);
  public can(
    action: string,
    resource: string,
    condition: Bfn<User> | boolean | undefined = true
  ) {
    const permissionAction = (this.permissionBucket[action] ??=
      Object.create(null));
    const permissionResource = (permissionAction[resource] ??= []);

    permissionResource.push(wrap(condition));
  }

  /**
   * If true, the user cannot
   */
  public cannot(
    action: string,
    resource: string,
    condition: boolean | undefined | Bfn<User> = true
  ) {
    this.can(action, resource, (u) => invertBoolean(wrap(condition)(u)));
  }

  compile(): Record<
    Action,
    (user: User | null, action: string, resource: Resource) => boolean
  > {
    const o: Record<
      Action,
      (user: User | null, action: string, resource: Resource) => boolean
    > = Object.create(null);
    for (const [action, bucket] of Object.entries(this.permissionBucket)) {
      // Guarantee key
      o[action as Action] = (
        user: User | null,
        _action: string,
        resource: Resource
      ) => {
        if (user === null) return false;
        const conditions = bucket[resource];
        for (const condition of conditions!) {
          const result = condition(user);
          if (result !== undefined) return result;
        }
        return false;
      };
    }
    return o;
  }
}

/**
 * Accepts a function for type inference
 */
function defineAbilities<
  User extends Record<string, unknown> = Record<string, unknown>,
  Perms extends string = string,
  Resource extends string = string
>(F: (user: ProxyUser<User, Perms, Resource>) => void) {
  const user = new ProxyUser<User, Perms, Resource>();
  F(user);
  return user;
}

export { defineAbilities };
