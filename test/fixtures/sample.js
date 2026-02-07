/**
 * Sample JavaScript file with various JSDoc patterns for testing eslint-plugin-estl.
 * This file intentionally contains both correct and incorrect JSDoc to test the rules.
 */

// ============================================================================
// ACCURATE-JSDOC: These have mismatched types
// ============================================================================

/**
 * Incorrect: says string but returns number
 * @param {string} value - Should be number
 * @returns {string} - Should be number
 */
function double(value) {
  return value * 2;
}

/**
 * Correct: types match
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

// ============================================================================
// NO-REDUNDANT-JSDOC: These have unnecessary type annotations
// ============================================================================

/** @type {string} */
const name = "Alice";

/** @type {number} */
const age = 30;

/**
 * Description that should be kept.
 * @type {boolean}
 */
const isActive = true;

// ============================================================================
// NO-IMPLICIT-ANY: These need JSDoc because TS infers any
// ============================================================================

function processData(data) {
  return data.value;
}

function handleCallback(callback) {
  return callback();
}

// ============================================================================
// REQUIRE-JSDOC-TYPES: Exported functions need complete JSDoc
// ============================================================================

/**
 * Partially documented - missing @returns
 * @param {number[]} items - Array of numbers
 */
export function sum(items) {
  return items.reduce((a, b) => a + b, 0);
}

export function multiply(a, b) {
  return a * b;
}

// ============================================================================
// COMPLEX TYPES: Testing type comparison
// ============================================================================

/**
 * Union type parameter
 * @param {string | number} value
 * @returns {string}
 */
function stringify(value) {
  return String(value);
}

/**
 * Array type
 * @param {Array<string>} items - Should normalize to string[]
 * @returns {number}
 */
function countItems(items) {
  return items.length;
}

/**
 * Optional parameter
 * @param {string} name
 * @param {string} [greeting="Hello"]
 * @returns {string}
 */
function greet(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

/**
 * Object parameter
 * @param {Object} options
 * @param {string} options.name
 * @param {number} [options.timeout]
 * @returns {void}
 */
function configure(options) {
  console.log(options.name);
}

// ============================================================================
// EDGE CASES
// ============================================================================

/**
 * Arrow function with JSDoc
 * @param {number} x
 * @returns {number}
 */
const squared = (x) => x * x;

/**
 * Async function
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

/**
 * Class with JSDoc
 */
class Calculator {
  /**
   * @param {number} initial
   */
  constructor(initial) {
    /** @type {number} */
    this.value = initial;
  }

  /**
   * @param {number} n
   * @returns {Calculator}
   */
  add(n) {
    this.value += n;
    return this;
  }
}

export { double, add, Calculator };
