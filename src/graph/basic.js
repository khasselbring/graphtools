/**
 * @overview Includes basic graph functions like creating a graph or cloning it.
 */

import cloneObj from 'lodash/fp/clone'
import curry from 'lodash/fp/curry'
import {create, isomorph as cIsomorph} from '../compound'
import {isomorphComponents} from './component'
import {setMetaKey} from './meta'
import {packageVersion} from '../internals'

/**
 * Creates a new graph that has the exact same nodes and edges.
 * @param {PortGraph} graph The graph to clone
 * @returns {PortGraph} A clone of the input graph.
 */
export function clone (graph) {
  return cloneObj(graph)
}

/**
 * Compares two graphs for structural equality (i.e. tests if they are isomorph, where it is
 * allowed to change the ids and paths of every node).
 * @param {Portgraph} graph1 One of the graphs to compare.
 * @param {Portgraph} graph2 The other the graph to compare.
 * @returns {boolean} True if both graphs are structually equal, false otherwise.
 */
export const isomorph = curry((graph1, graph2) => {
  return cIsomorph(graph1, graph2) && isomorphComponents(graph1, graph2)
})

/**
 * Create a new compound node. Each compound node is itself a graph that can contain further nodes.
 * @param {Node} node The node that should be converted into a compound node.
 * @returns {PortGraph} The graph representing the compound node.
 */
export const compound = create

/**
 * Returns a new empty graph.
 * @returns {PortGraph} A new empty port graph.
 */
export function empty () {
  return setMetaKey('version', packageVersion(), create())
}
