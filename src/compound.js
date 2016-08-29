/** @module Edge */

import {isReference, id as nodeID} from './node'

/**
 * Checks whether a node is a compound node.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is a compound node, false otherwise.
 */
export function isCompound (node) {
  return !isReference(node) && !node.atomic && !!node.Nodes && !!node.Edges
}

export function id (node) {
  if (node.id) {
    return nodeID(node)
  } else return null
}
