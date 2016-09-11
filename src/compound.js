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
  return !isReference(node) && !node.atomic && !!node.Nodes && !!node.Edges
}

export function id (node) {
  if (node.id) {
    return nodeID(node)
  } else return null
}

export function setPath (node, path, nodeSetPath) {
  return _.merge({}, node,
    {path},
    {Nodes: node.Nodes.map((n) => nodeSetPath(n, path))},
    {Edges: node.Edges.map((e) => Edge.setPath(e, path))}
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
    Nodes: [],
    MetaInformation: {},
    Edges: [],
    Components: [],
    path: []
  }, node)
}
