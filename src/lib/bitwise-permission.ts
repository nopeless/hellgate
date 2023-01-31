import assert from "node:assert";

type EnumType = Record<string, number | string> & Record<number, string>;

/**
 * Creates a bitwise permission
 *
 * If user is null, it will only return true if permission is 0
 *
 * @param field The field to check of the user ex) user.permissions
 * @param enum_ The enum to check against. Typescript Enums are recommended
 */
function bitwisePermission<FieldKey extends string, E extends EnumType>(
  field: FieldKey,
  enum_: E
) {
  const bitwisePermFunc = (
    user: null | { [k in FieldKey]: number },
    _action: unknown,
    bit: number | keyof E
  ) => {
    if (typeof bit === `string`) {
      bit = enum_[bit];
    }

    assert(typeof bit === `number`, `bit must be a number`);

    if (user === null) {
      return bit === 0;
    }
    return (user[field] & bit) === bit;
  };

  return bitwisePermFunc;
}

export { bitwisePermission };
