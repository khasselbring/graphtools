/**
 * @module Algrithm
 * @overview
 * A collection of algorithms that act on the port graph.
 */

import * as Graph from './graph'
import * as Node from './node'
import * as Compound from './compound'

/*
import debugLog from 'debug'

const debug = debugLog('graphtools')*/

const nonConnected = (graph) => {
  return Graph.nodes(graph).filter(
    (n) => Graph.predecessors(n, graph).length === 0)
}

/**
 * Returns a topological sorting of the graph.
 * @param {PortGraph} graph The graph.
 * @return {Node[]} A sorting of the nodes given as an array of nodes.
 * @throws {Error} If the graph has loops.
 */
export function topologicalSort (graph) {
  if (Node.inputPorts(graph, true).length > 0) {
    return topologicalSort(
      Graph.flow(Node.inputPorts(graph, true).map((p) => Compound.removePort(p)))(graph))
  }
  if (Graph.nodes(graph).length === 0) {
    return []
  }
  var nonConn = nonConnected(graph)
  if (nonConn.length === 0) {
    throw new Error('Found cycle in the graph. Impossible to calculate topological sorting.')
  }
  return nonConn.concat(
    topologicalSort(Graph.flow(nonConn.map((n) => Graph.removeNode(n)))(graph))
  )
}
