/** @module transmission-sim */

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
	 * @param {object} params - The parameters governing the outbreak.
	 * These are curried functions that wait for an x value, and are keyed as {infectivityCDF:,R0cdf:}
	 */
  constructor(params = {}) {
    this.epiParams = params;
    this.index = {
      onset: 0,
      level: 0
    };
    this.caseList = [...this.preorder()];
    this.caseList.forEach((n, index) => (n.key = Symbol.for(`case ${index}`)));
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
        onset: donor.onset + epiParameters.infectivity()
      };

      donor.children.push(child);
    }
  }

  /**
	 * A function that calls a transmission call on all nodes until the desired number of days have passed
	 * to the outbreak. It starts at the most recent level.
	 * @param levels - the number of levels to add to the growing transmission chain.
	 */
  spread(days) {
    let currentTime = this.cases.map(node => node.onset).reduce((max, cur) => Math.max(max, cur), -Infinity);
    let currentLevel = this.cases.map(node => node.level).reduce((max, cur) => Math.max(max, cur), -Infinity);
    const targetTime = currentTime + days;

    while (currentTime < targetTime) {
      // each node only gets one chance to transmit. Get those elible.

      const possibleDonors = this.cases.filter(x => x.level === currentLevel);

      for (const donor of possibleDonors) {
        this.transmit(donor, this.epiParams);
      }
      this.caseList = [...this.preorder()];
      currentLevel = +1;
    }
    // remove cases that happen after the provided date. They will stay as children nodes.
    this.caseList = this.caseList.filter(c => c.onset < targetTime);
  }
}
