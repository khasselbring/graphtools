
import find from 'lodash/fp/find'
import * as Edge from '../edge'

/**
 * Checks whether the two nodes are connected via an edge.
 * @param {PortGraph} graph The graph in which we want to find the connection.
 * @param {Node} nodeFrom The starting point of our connection.
 * @param {Node} nodeTo The target of our connection.
 * @returns {boolean} True if the graph has an edge going from "nodeFrom" to "nodeTo".
 */
export function areConnected (graph, nodeFrom, nodeTo) {
  return !!find(graph.edges, (e) => Edge.isFrom(nodeFrom, e) && Edge.pointsTo(nodeTo, e))
}

/**
 * Returns a list of predecessors for a node including the input port. Each node can only have exactly one
 * predecessor for every port.
 * @param {PortGraph} graph The graph.
 * @param {Node|Port} target The target to which the predecessores point.
 * @returns {Port[]} A list of ports with their corresponding nodes
 */
export function predecessors (graph, target) {
  return graph.edges.filter(Edge.pointsTo(target))
}

/**
 * Returns the predecessors for a node including the input port. Each node can only have exactly one
 * predecessor for every port.
 * @param {PortGraph} graph The graph.
 * @param {Node|Port} target The target to which the predecessores point.
 * @returns {Port} The preceeding port with the corresponding node
 */
export function predecessor (graph, node) {
  return predecessors(graph, node)[0]
}

/**
 * Get the successors of one node in the graph, optionally for a specific port.
 * @param {PortGraph} graph The graph.
 * @param {Node|Port} source The source from which to follow the edges.
 * @returns {Port[]} A list of ports that succeed the node with their corresponding nodes.
 */
export function successors (graph, source) {
  return graph.edges.filter(Edge.isFrom(source))
}
