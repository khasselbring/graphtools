
import cloneObj from 'lodash/fp/clone'
import isEqual from 'lodash/fp/isEqual'
import curry from 'lodash/fp/curry'
import set from 'lodash/fp/set'
import {create} from '../compound'
import {isReference} from '../node'
import {setMeta} from './meta'
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
 * Compares two graphs for structural equality.
 * @param {Graphlib} graph1 One of the graphs to compare.
 * @param {Graphlib} graph2 The other the graph to compare.
 * @returns {boolean} True if both graphs are structually equal, false otherwise.
 */
export const equal = curry((graph1, graph2) => {
  return isEqual(graph1, graph2)
})

/**
 * Create a new compound node. Each compound node is itself a graph that can contain further nodes.
 * @param {Node} node The node that should be converted into a compound node.
 * @returns {PortGraph} The graph representing the compound node.
 */
export const compound = create

/**
 * Checks whether the graph allows references to components. This is usally disabled after the graph is resolved.
 * Resolving a graph replaces all references with their components.
 * @params {PortGraph} graph The graph
 * @returns {boolean} True if the graph allows references, false otherwise.
 */
export function allowsReferences (graph) {
  return !graph.blockReferences
}

/**
 * Stops references from being inserted into the graph. After references are disallowed they cannot and should not be reallowed.
 * @params {PortGraph} graph The graph.
 * @returns {PortGraph} The graph given as an argument where references are now disallowed.
 * @throws {Error} If the graph has references it throws an error. Only graphs without references can disallow them.
 */
export function disallowReferences (graph) {
  if (graph.nodes.filter(isReference).length !== 0) {
    throw new Error('Graph still contains referencens. Impossible to disallow references.')
  }
  return set(graph, 'blockReferences', true)
}

/**
 * Returns a new empty graph.
 * @returns {PortGraph} A new empty port graph.
 */
export function empty () {
  return setMeta('version', packageVersion(), create())
}
