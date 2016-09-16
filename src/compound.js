/** @module Edge */

import {isReference, id as nodeID} from './node'
import * as Edge from './edge'
import _ from 'lodash'

/**
 * Checks whether a node is a compound node.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is a compound node, false otherwise.
 */
export function isCompound (node) {
  return !isReference(node) && !node.atomic && !!node.nodes && !!node.edges
}

export function id (node) {
  if (node.id) {
    return nodeID(node)
  } else return null
}

export function setPath (node, path, nodeSetPath) {
  return _.merge({}, node,
    {path},
    {nodes: node.nodes.map((n) => nodeSetPath(n, path))},
    {edges: node.edges.map((e) => Edge.setPath(e, path))}
  )
}

/**
 * Create a new compound either with a template, or an empty one.
 * @params {Node} node An optional node template that contains the name and ports of the compound.
 * @returns {Compound} The compound representing the given node.
 */
export function create (node) {
  node = node || {}
  return _.merge({
    nodes: [],
    metaInformation: {},
    edges: [],
    components: [],
    path: []
  }, node)
}
