import { assert, Equals } from "tsafe";
import { MergeParameters } from "../src";

type f1 = () => number;
type f2 = (a: number | string) => string;
type f3 = (a: string | boolean, b: object) => boolean;
type f4 = (u: unknown, ...args: unknown[]) => null;
type f5 = (u: unknown, u2: unknown, ...args: number[]) => symbol;

/**
 * These tests will always pass, but it is a good indication/way to check whether a type is being tested
 *
 * In IDEs, you can fold the functions so you can see specific tests
 */
describe(`types`, () => {
  it(`MergeParameters`, () => {
    assert<Equals<MergeParameters<[]>, []>>();
    assert<Equals<MergeParameters<[() => unknown]>, []>>();
    assert<Equals<MergeParameters<[() => unknown, () => unknown]>, []>>();
    assert<Equals<MergeParameters<[f1, f2]>, [number | string]>>();
    assert<Equals<MergeParameters<[f1, f4]>, [unknown, ...unknown[]]>>();
    assert<Equals<MergeParameters<[f2, f3]>, [string, object]>>();
    assert<
      Equals<
        MergeParameters<[(a: number, ...r: unknown[]) => unknown]>,
        [number, ...unknown[]]
      >
    >();
    assert<Equals<MergeParameters<[f5]>, [unknown, unknown, ...number[]]>>();
  });
});
