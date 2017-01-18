/**
 * @module Functional
 */

/**
 * Returns the type of a lambda node.
 * @param {Node} node The node to check.
 * @returns {Type} The type of the lambda function. If the node is no lambda function it will return undefined.
 */
export function lambdaType (node) {
  if (node.componentId === 'lambda') {
    return { type: 'function', arguments: [] }
  }
}