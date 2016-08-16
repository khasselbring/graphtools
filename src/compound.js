/** @module Edge */

import {isReference, equal} from './node'
import _ from 'lodash'

/**
 * Checks whether a node is a compound node.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is a compound node, false otherwise.
 */
export function isCompound (node) {
  return !isReference(node) && !node.atomic && node.implementation
}

/**
 * Sets the implementation of a node defined in a compound node to a new implementation.
 * @param {Compound} comp The compound node that should be changed.
 * @param {string} id The id of the node in the implementation of the compound that should be changed.
 * @param {Node} newNode The new node that updates the node with the given id.
 * @reutrns {Compound} The compound node with the updated node.
 */
export function replaceImplementation (comp, id, newNode) {
  var idx = _.findIndex(comp.implementation.nodes, (n) => equal(id, n))
  return _.set(comp, 'implementation.nodes[' + idx + ']', newNode)
}
