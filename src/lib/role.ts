// Adds role system
import { Merge } from "../types";
import { Underworld } from "../underworld";

// TODO add validator for roleProperty

function addRoleSystem<
  U extends Record<string, unknown>,
  O extends Record<string, string[]>,
  roleProperty extends string = `roles`
>(
  underworld: Underworld<O>,
  getRoles: (user: U) => string[],
  statusesProperty: roleProperty = `statuses` as roleProperty
) {
  return function (user: U) {
    const statuses = underworld.statusesOf(
      underworld.getValidStatusesFrom(getRoles(user))
    );
    const o = {
      hasStatus: (role: keyof O & string) =>
        underworld.doStatusesGrant(statuses, [role]),
      hasRole: (role: keyof O & string) => statuses.includes(role),
      /**
       * Higher status
       */
      higherThan: (user: U) => {
        const otherStatuses = underworld.statusesOf(
          underworld.getValidStatusesFrom(getRoles(user))
        );
        return underworld.compareStatuses(statuses, otherStatuses) > 0;
      },
    };
    if (Object.hasOwn(o, statusesProperty)) {
      throw new Error(
        `statuses property cannot be named '${statusesProperty}' which is already in use`
      );
    }
    return Object.assign(o, { [statusesProperty]: statuses }) as Record<
      string,
      unknown
    > as Merge<typeof o, Record<roleProperty, (keyof O & string)[]>>;
  };
}

export { addRoleSystem };
