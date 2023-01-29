import {
  CircularReferenceFault,
  GraphError,
  MissingKeyDefinitionFault,
  TypeFault,
  Underworld,
} from "@src";

describe(`Underworld`, function () {
  it(`basic usage`, function () {
    const underworld = new Underworld({
      a: [`b`, `c`],
      b: [`c`],
      c: [],
    });

    expect(underworld.statusesOf(`a`)).to.deep.equal([`a`, `b`, `c`]);
    expect(underworld.statusesOf(`b`)).to.deep.equal([`b`, `c`]);
  });
  it(`coverage`, function () {
    expect(
      () =>
        // @ts-expect-error
        new Underworld({ a: [`b`] }, { strict: true })
    ).to.throw(GraphError);

    const v = Underworld.verify({ a: [`b`] });
    expect(v).to.not.be.empty;
    expect(v[0] instanceof MissingKeyDefinitionFault);

    const underworld = new Underworld({
      a: [],
      b: [`c`, `d`],
      c: [],
      d: [`a`, `c`],
    });

    expect(underworld.faults).to.be.empty;

    expect(underworld.graph).to.deep.equal({
      a: [],
      b: [`c`, `d`],
      c: [],
      d: [`a`, `c`],
    });

    // User shouldn't be able to push
    // But lets say they did
    // @ts-expect-error
    underworld.graph.c.push(`d`);
    // @ts-expect-error
    underworld.graph.c.push(`c`);
    underworld.update();

    expect(underworld.faults[0] instanceof CircularReferenceFault);

    // User assigned non-array
    // @ts-expect-error
    underworld.graph.c = 1;
    underworld.update();

    expect(underworld.faults[0] instanceof TypeFault);

    // User added non-key
    // @ts-expect-error
    underworld.graph.c = [`e`];
    underworld.update();

    expect(underworld.faults[0] instanceof MissingKeyDefinitionFault);

    expect(underworld.doStatusesGrant([`a`], [`d`])).to.be.false;
    expect(underworld.doStatusesGrant([`d`], [`d`])).to.be.true;

    expect(underworld.doStatusesGrant([`d`], [`d`, `b`])).to.be.true;
    expect(underworld.doStatusesGrant([`d`], [`d`, `b`], true)).to.be.false;
    expect(underworld.doStatusesGrant([`d`], [`d`, `a`], true)).to.be.true;

    expect(underworld.formattedGraph()).to.equal(`a: [a]
e: [e]
b: [b, c, e, d, a]
c: [c, e]
d: [d, a, c, e]`);

    // @ts-expect-error
    underworld.update({ a: [`a`, `a`] });
    expect(underworld.faults[0] instanceof CircularReferenceFault);
    expect(underworld.dump()).to.deep.equal({ a: [`a`] });

    underworld.update({ a: [`c`], b: [`c`], c: [`d`], d: [] });

    expect(underworld.faults).to.be.empty;
    expect(underworld.compareStatuses(`a`, `b`)).to.equal(0);
    expect(underworld.compareStatuses(`a`, `c`)).to.equal(1);
    expect(underworld.compareStatuses(`d`, `a`)).to.equal(-1);
  });
});
