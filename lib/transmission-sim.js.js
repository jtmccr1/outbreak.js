(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("transmission-sim.js", [], factory);
	else if(typeof exports === 'object')
		exports["transmission-sim.js"] = factory();
	else
		root["transmission-sim.js"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports, "__esModule", { value: true }); /** @module transmission-sim */

/**
                                                                                                             * The Outbreak class. Currently the rate of transmission is constant but it could be adjusted in
                                                                                                             * the future. That'd be nice.
                                                                                                             */

class Outbreak {
  /**
                * The constructor takes a config object containing a starting seed for the outbreak,
                * a probability distribution for infectivity over time, and a distribution from which to draw the
                * number of subsequent infections.
                *
                * @constructor
                * @param {object} params - The parameters governing the outbreak.
                * These are curried functions that wait for an x value, and are keyed as {infectivityCDF:,R0cdf:}
                */
  constructor(params = {}) {
    this.epiParams = params;
    this.index = {
      onset: 0,
      level: 0 };

    this.caseList = [...this.preorder()];
    this.caseList.forEach((n, index) => n.key = Symbol.for(`case ${index}`));
    this.caseMap = new Map(this.caseList.map(node => [node.key, node]));
  }
  /**
    * Gets the index case node of the outbreak
    *
    * @returns {Object|*}
    */
  get indexCase() {
    return this.index;
  }
  /**
    * Gets the epiparameters used in the outbreak
    *
    * @returns {Object|*}
    */
  get epiParameters() {
    return this.epiParams;
  }

  /**
    * Returns a case from its key (a unique Symbol) stored in
    * the node as poperty 'key'.
    *
    * @param key
    * @returns {*}
    */
  getCase(key) {
    return this.caseMap.get(key);
  }
  /**
    * A generator function that returns the nodes in a post-order traversal.
    * This is borrowed from figtree.js c- Andrew Rambaut.
    * @returns {IterableIterator<IterableIterator<*|*>>}
    */
  *postorder() {
    const traverse = function* (node) {
      if (node.children) {
        for (const child of node.children) {
          yield* traverse(child);
        }
      }
      yield node;
    };

    yield* traverse(this.indexCase);
  }

  /**
    * A generator function that returns the nodes in a pre-order traversal
    * This is borrowed from figtree.js c- Andrew Rambaut.
    * @returns {IterableIterator<IterableIterator<*|*>>}
    */
  *preorder() {
    const traverse = function* (node) {
      yield node;
      if (node.children) {
        for (const child of node.children) {
          yield* traverse(child);
        }
      }
    };

    yield* traverse(this.indexCase);
  }
  get cases() {
    return [...this.caseList];
  }

  /**
    * Gets an array containing all the external node objects
    * This is borrowed from figtree.js c- Andrew Rambaut.
    * @returns {*}
    */
  get externalCases() {
    return this.cases.filter(node => node.children);
  }
  /**
    * Returns transmitted cases from a donor case
    *
    * @param donor - the donor case, epiParameters - object keyed with R0 and infectivity
    * where each entry is a function which returns a sample from a distribution.
    * @returns adds children to donor case if transmission occurs
    */
  transmit(donor, epiParameters) {
    // How many transmissions with this case have
    const numberOftransmissions = epiParameters.R0();

    if (numberOftransmissions > 0) {
      donor.children = [];
    }
    for (let i = 0; i < numberOftransmissions; i++) {
      const child = {
        parent: donor,
        level: donor.level + 1,
        onset: donor.onset + epiParameters.infectivity() };


      donor.children.push(child);
    }
  }

  /**
    * A function that calls a transmission call on all nodes until the desired number of levels is added
    * to the outbreak. It starts at the most recent level.
    * @param levels - the number of levels to add to the growing transmission chain.
    */
  spread(levels) {
    for (let i = 0; i < levels; i++) {
      const maxLevel = this.cases.map(node => node.level).reduce((max, cur) => Math.max(max, cur), -Infinity);

      const possibleDonors = this.cases.filter(x => x.level === maxLevel);

      for (const donor of possibleDonors) {
        this.transmit(donor, this.epiParams);
      }
      this.caseList = [...this.preorder()];
    }
  }}exports.Outbreak = Outbreak;

/***/ })
/******/ ]);
});
//# sourceMappingURL=transmission-sim.js.js.map