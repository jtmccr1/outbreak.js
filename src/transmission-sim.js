/** @module transmission-sim */

/**
 * The case class. this represent a single
 */
export class Case {
  /**
	 * The constructor takes a parent case containing probability distribution for infectivity over time, and a distribution from which to draw the
	 * number of subsequent infections, and the time of symptom onset.
	 *
	 * @constructor
	 * @param {object} params - The parameters governing the outbreak. These are curried functions that return a random sample from a distribution {infectivity:,R0:,onset:}
	 */
  constructor(onset = 0, donorCase = {}, level = 0) {
    this.parent = donorCase;
    this.children = [];
    this.level = level;
    this.onset = onset;
  }
  /**
	 * Returns transmitted cases from a donor case
	 * the node as poperty 'key'.
	 *
	 * @param key
	 * @returns {*}
	 */
  transmit(epiParameters) {
    // How many transmissions with this case have
    const numberOftransmissions = epiParameters.R0();

    for (let i = 0; i < numberOftransmissions; i++) {
      const child = new Case(this.onset + epiParameters.infectivity(), this, this.level + 1);

      this.children.push(child);
    }
  }
}
/**
 * The Outbreak class. Currently the rate of transmission is constant but it could be adjusted in
 * the future. That'd be nice.
 */

export class Outbreak {
  /**
	 * The constructor takes a config object containing a starting seed for the outbreak,
	 * a probability distribution for infectivity over time, and a distribution from which to draw the
	 * number of subsequent infections.
	 *
	 * @constructor
	 * @param {object} params - The parameters governing the outbreak. These are curried functions that wait for an x value, and are keyed as {infectivityCDF:,R0cdf:}
	 */
  constructor(params = {}, indexCase = new Case()) {
    this.epiParams = params;
    this.index = indexCase;
    this.caseList = [...this.preorder()];
    // this.caseList.forEach((case, index) => (case.key = Symbol.for(`case ${index}`)));
    // this.caseMap = new Map(this.caseList.map(case => [case.key, case]));
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
  * postorder() {
    const traverse = function * (node) {
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
  * preorder() {
    const traverse = function * (node) {
      yield node;
      if (node.children.length > 0) {
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
    return this.cases.filter(node => node.children.length === 0);
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
        donor.transmit(this.epiParams);
      }
      this.caseList = [...this.preorder()];
    }
  }
}
