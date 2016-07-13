
import graphlib from 'graphlib'
import _ from 'lodash'
import deprecate from 'deprecate'
import * as io from './io'
import * as algorithm from './algorithm'
import {isMetaKey} from './utils'

/**
 * Compares two graphs for structural equality.
 * @param {Graphlib} graph1 One of the graphs to compare.
 * @param {Graphlib} graph2 The other the graph to compare.
 * @returns {boolean} True if both graphs are structually equal, false otherwise.
 */
export const equal = (graph1, graph2) => {
  return _.isEqual(toJSON(graph1), toJSON(graph2))
}

/**
 * Creates a new graph that has the exact same nodes and edges.
 * @param {Graphlib} graph The graph to clone
 * @returns {Graphlib} A clone of the input graph.
 */
export function clone (graph) {
  if (typeof (graph.graph) === 'function') {
    return graphlib.json.read(graphlib.json.write(graph))
  } else {
    return _.clone(graph)
  }
}

/**
 * Returns a list of node objects.
 * @param {PortGraph} graph The graph.
 * @returns {Nodes[]} A list of nodes.
 */
export function nodes (graph) {
  return _(graph.nodes())
    .reject(isMetaKey)
    .map((n) => ({v: n, parent: graph.parent(n), value: graph.node(n)}))
    .value()
}

/**
 * Returns a list of node names.
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of node names.
 */
export function nodeNames (graph) {
  return _.reject(graph.nodes(), isMetaKey)
}

/**
 * Returns the meta information encoded in the graph
 * @param {PortGraph} graph The graph.
 * @returns {object} An object with all meta information keys.
 */
export function metaInformation (graph) {
  return _(graph.nodes())
    .filter(isMetaKey)
    .map((n) => [n.slice(5), graph.node(n)])
    .fromPairs()
    .value()
}

/**
 * Returns a new empty graph.
 * @returns {PortGraph} A new empty port graph.
 */
export function empty () {
  return new graphlib.Graph({directed: true, compound: true, multigraph: true})
}

// DEPRECATED METHODS --- will be removed in the future.

/**
 * Parses the pure JSON format to return a graphlib version of the graph.
 * @param {Object} json A JSON representation (e.g. created by toJSON) of a graph.
 * @returns {Graphlib} A graphlib graph of the editGraph
 */
export const importJSON = (json) => {
  deprecate('`graph.importJSON` is deprecated. Please use `io.importJSON` instead')
  return io.importJSON(json)
}

/**
 * Returns the pure JSON representation of the graph without all the graphlib features.
 * @param {Graphlib} graph The graph in graphlib format to convert
 * @returns {Object} A JSON representation of the graph.
 */
export const toJSON = (graph) => {
  deprecate('`graph.toJSON` is deprecated. Please use `io.toJSON` instead')
  // make sure all references are gone!
  return io.toJSON(graph)
}

/**
 * Parses a graphlib graph from the given string.
 * @param {string} graphStr The graph represented as a string
 * @returns {Graphlib} The graph in graphlib format
 */
export const readFromString = (graphStr) => {
  deprecate('`graph.readFromString` is deprecated. Please use `io.readFromString` instead')
  return io.readFromString(graphStr)
}

/**
 * Reads a graph from a file
 * @param {string} file The filename to read.
 * @returns {Graphlib} The graph in graphlib format.
 */
export const readFromFile = (file) => {
  deprecate('`graph.readFromFile` is deprecated. Please use `io.readFromFile` instead')
  return io.readFromFile(file)
}

/**
 * Reads a graph in JSON format from a file
 * @param {string} file The filename to read.
 * @returns {JSON} The graph in JSON format.
 */
export const jsonFromFile = (file) => {
  deprecate('`graph.jsonFromFile` is deprecated. Please use `io.jsonFromFile` instead')
  return io.jsonFromFile(file)
}

/**
 * Removes all continuations from a graph (only for debug purposes)
 * @param {Graphlib} graph The graph
 * @returns {Graphlib} A graph that has no continuations edges
 */
export function removeContinuations (graph) {
  deprecate('`removeContinuations` is deprecated. Please use `algorithm.removeContinuations` instead.')
  return algorithm.removeContinuations(graph)
}

/**
 * Returns a topological sorting of the graph. Removes all continuations before calculating the topological sorting.
 * @param {Graphlib} graph The graph.
 * @return {string[]} A sorting of the nodes.
 * @throws {Error} If the graph has loops.
 */
export function topoSort (graph) {
  deprecate('`graph.topoSort` is deprecated. Please use `algorithm.topologicalSort` instead.')
  return algorithm.topologicalSort(graph)
}
