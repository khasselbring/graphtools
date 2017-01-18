/**
 * @module Functional
 */

import * as Node from '../node'

/**
 * Returns the type of a lambda node.
 * @param {Node} node The node to check.
 * @returns {Type} The type of the lambda function. If the node is no lambda function it will return undefined.
 */
export function lambdaType (node) {
  if (node.componentId === 'lambda') {
    return {
      type: 'function',
      arguments: lambdaArguments(node),
      returnValues: returnValues(node)
    }
  }
}

export function lambdaImplementation (node) {
  if (node.componentId === 'lambda') {
    return node.λ
  }
}

export function λ (node) {
  return lambdaImplementation(node)
}

export function lambdaArguments (node) {
  return Node.inputPorts(λ(node))
    .map((p) => ({name: p.port, type: p.type}))
}

export function returnValues (node) {
  return Node.outputPorts(λ(node))
    .map((p) => ({name: p.port, type: p.type}))
}
