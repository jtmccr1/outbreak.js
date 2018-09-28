// var expect = require('chai').expect;
// var beforeEach = require('mocha').beforeEach;
var jStat = require('jStat');

import { Case, Outbreak } from './transmission-sim';
// const Case = require('./Outbreak.js').Case;
// const Outbreak = require('./Outbreak.js').Outbreak;
const x = new Case(0);
const params = {
  R0: () => jStat.normal.sample(2, 0.1),
  infectivity: () => jStat.gamma.sample(1, 4)
};

const out = new Outbreak(params);

out.spread(5);
x.transmit(params);
console.log(x);

// describe('Process Newick tree', function () {
//   beforeEach(function () {});
// });
