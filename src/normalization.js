
/** @module normalization */

import _ from 'lodash'

/**
 * Returns a list of non conform edges in the graph
 */
export function nonConformEdges (graph) {
  return _.filter(graph.edges(), (e) =>
    graph.parent(e.v) !== graph.parent(e.w) && // parents are different
    e.v !== graph.parent(e.w) && graph.parent(e.v) !== e.w) // and none is the parent of the other (e.g. part of the compound node)
}

/**
 * Conform Edges start and end inside the same parent node
 */
export function hasConformEdges (graph) {
  return nonConformEdges(graph).length === 0
}

/**
 * A normalized graph has
 *  - conformEdges
 * ...
 */
export function isNormalized (graph) {
  // TODO: Define what a normalized graph is.
  return hasConformEdges(graph) && false
}
