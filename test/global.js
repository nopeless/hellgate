const chai = require(`chai`);

global.REQUIRE_HELLGATE = require(`../src/index.js`);
global.chai = chai;
global.expect = chai.expect;
global.should = chai.should;
global.assert = chai.assert;
