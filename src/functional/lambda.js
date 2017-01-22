/**
 * @module Functional
 */

import merge from 'lodash/fp/merge'
import omit from 'lodash/fp/omit'
import * as Node from '../node'

/**
 * Returns the type of a lambda node.
 * @param {Node} node The node to check.
 * @returns {Type} The type of the lambda function. If the node is no lambda function it will return undefined.
 */
export function type (node) {
  if (node.componentId === 'functional/lambda') {
    return {
      type: 'function',
      arguments: lambdaArguments(node),
      returnValues: returnValues(node)
    }
  }
}

export function implementation (node) {
  if (isValid(node)) {
    return node.λ
  }
}

const unID = (node) => {
  return omit(['id', 'path'], node)
}

export function createLambda (implementation, node) {
  const nodeTmp = merge({componentId: 'functional/lambda', λ: Node.create(unID(implementation))}, node || {})
  return merge(nodeTmp, {
    ports: [{port: 'fn', kind: 'output', type: type(nodeTmp)}]
  })
}

/**
 * Creates a new lambda node that has given the implementation set as its implementation.
 * @param {Node} implementation The implementation to use for the lambda node.
 * @param {Node} lambda The lambda node in which you want to update the implementation.
 * @returns {Node} A new lambda node based on `lambda` that has the implementation given by `implementation`.
 * @throws {Error} If the node given by `lambda` is no lambda component.
 */
export function setImplementation (implementation, lambda) {
  assertValid(lambda)
  return merge(lambda, {λ: implementation})
}

export function λ (node) {
  return implementation(node)
}

export function lambdaArguments (node) {
  return Node.inputPorts(λ(node))
    .map((p) => ({name: p.port, type: p.type}))
}

export function returnValues (node) {
  return Node.outputPorts(λ(node))
    .map((p) => ({name: p.port, type: p.type}))
}

export function isValid (node) {
  return !!(node.componentId === 'functional/lambda' && node.λ)
}

export function assertValid (node) {
  if (!typeof (node) === 'object' || !node.componentId) {
    throw new Error('Expected lambda node but found: ' + JSON.stringify(node))
  }
  if (node.componentId !== 'functional/lambda') {
    throw new Error('Lambda node must have the componentId "functionalLambda". Got "' + node.componentId + '" for node at ' + node.path)
  }
  if (!node.λ) {
    throw new Error('Lambda node must have an implementation stored at "λ". Node at "' + node.path + '" is missing the implementation.')
  }
}
