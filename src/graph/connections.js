
import find from 'lodash/fp/find'
import map from 'lodash/fp/map'
import curry from 'lodash/fp/curry'
import * as Edge from '../edge'
import {edges} from './edge'
import {query} from '../location'

/**
 * Checks whether an edge points to a given target.
 * @param {Node|Port} target The target the edge should point to. This can either be a node or a port.
 * @returns {boolean} True if the edge points to the target, false otherwise.
 */
export const pointsTo = curry((target, graph, edge) => {
  var q = query(target, graph)
  return q(edge.to)
})

export const isFrom = curry((source, graph, edge) => {
  var q = query(source, graph)
  return q(edge.from)
})

/**
 * Checks whether the two nodes are connected via an edge.
 * @param {PortGraph} graph The graph in which we want to find the connection.
 * @param {Node} nodeFrom The starting point of our connection.
 * @param {Node} nodeTo The target of our connection.
 * @returns {boolean} True if the graph has an edge going from "nodeFrom" to "nodeTo".
 */
export function areConnected (nodeFrom, nodeTo, graph) {
  return !!find(edges(graph), (e) => Edge.isFrom(nodeFrom, e, graph) && Edge.pointsTo(nodeTo, e, graph))
}

/**
 * Returns a list of predecessors for a node including the input port. Each node can only have exactly one
 * predecessor for every port.
 * @param {PortGraph} graph The graph.
 * @param {Node|Port} target The target to which the predecessores point.
 * @returns {Port[]} A list of ports with their  corresponding nodes
 */
export function predecessors (target, graph) {
  return map('from')(inIncidents(target, graph))
}

/**
 * Returns the predecessors for a node including the input port. Each node can only have exactly one
 * predecessor for every port.
 * @param {PortGraph} graph The graph.
 * @param {Node|Port} target The target to which the predecessores point.
 * @returns {Port} The preceeding port with the corresponding node
 */
export function predecessor (node, graph) {
  return predecessors(node, graph)[0]
}

/**
 * Gets all ingoing incident edges to a port
 * @param {Port} port The port
 * @param {PortGraph} graph The graph
 * @returns {Edge[]} An array of all ingoing incident edges.
 */
export function inIncidents (port, graph) {
  return edges(graph).filter(pointsTo(port, graph))
}

/**
 * Gets the ingoing incident edges to a port
 * @param {Port} port The port
 * @param {PortGraph} graph The graph
 * @returns {Edge} The ingoing incident edge (if there are somehow more than one in edge it returns the first found.)
 */
export function inIncident (port, graph) {
  return inIncidents(port, graph)[0]
}

/**
 * Gets all outgoing incident edges to a port
 * @param {Port} port The port
 * @param {PortGraph} graph The graph
 * @returns {Edge[]} An array of all outgoing incident edges.
 */
export function outIncidents (port, graph) {
  return edges(graph).filter(isFrom(port, graph))
}

/**
 * Get the successors of one node in the graph, optionally for a specific port.
 * @param {PortGraph} graph The graph.
 * @param {Node|Port} source The source from which to follow the edges.
 * @returns {Port[]} A list of ports that succeed the node with their corresponding nodes.
 */
export function successors (source, graph) {
  return map('to')(outIncidents(source, graph))
}

function or (fn1, fn2) {
  return (v) => fn1(v) || fn2(v)
}

export const incidents = curry((port, graph) => {
  return edges(graph).filter(or(isFrom(port, graph), pointsTo(port, graph)))
})
