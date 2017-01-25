
import find from 'lodash/fp/find'
import map from 'lodash/fp/map'
import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import * as Edge from '../edge'
import {edges} from './edge'
import {query} from '../location'
import {node} from '../graph/node'

/**
 * @function
 * @name pointsTo
 * @description Checks whether an edge points to a given target.
 * @param {Location} target The target the edge should point to. This can either be a node or a port.
 * @param {PortGraph} graph The graph
 * @param {Edge} edge The edge to check
 * @returns {boolean} True if the edge points to the target, false otherwise.
 */
export const pointsTo = curry((target, graph, edge) => {
  var q = query(target, graph)
  return q(edge.to)
})

/**
 * @function
 * @name isFrom
 * @description Checks whether an edge is from a given source.
 * @param {Location} target The source the edge should come from. This can either be a node or a port.
 * @param {PortGraph} graph The graph
 * @param {Edge} edge The edge to check
 * @returns {boolean} True if the edge comes from the source, false otherwise.
 */
export const isFrom = curry((source, graph, edge) => {
  var q = query(source, graph)
  return q(merge(edge.from, {additionalInfo: node(edge.from, graph)}))
})

/**
 * Checks whether the two nodes or ports are connected via an edge.
 * @param {Location} nodeFrom The starting point of our connection.
 * @param {Location} nodeTo The target of our connection.
 * @param {PortGraph} graph The graph in which we want to find the connection.
 * @returns {boolean} True if the graph has an edge going from "nodeFrom" to "nodeTo".
 */
export function areConnected (nodeFrom, nodeTo, graph) {
  return !!find(edges(graph), (e) => Edge.isFrom(nodeFrom, e, graph) && Edge.pointsTo(nodeTo, e, graph))
}

/**
 * Returns a list of predecessors for a node or a port. Each node can only have exactly one
 * predecessor for every port but this function always returns a list.
 * @param {Location} target The target to which the predecessores point.
 * @param {PortGraph} graph The graph.
 * @returns {Port[]} A list of ports with that are predecessors of `target`
 */
export function predecessors (target, graph) {
  return map('from')(inIncidents(target, graph))
}

/**
 * Returns the predecessors for a node or a port. Each node can only have exactly one
 * predecessor for every port.
 * @param {Location} target The target to which the predecessores points.
 * @param {PortGraph} graph The graph.
 * @returns {Port} The preceeding port
 */
export function predecessor (target, graph) {
  return predecessors(target, graph)[0]
}

/**
 * Gets all ingoing incident edges to a port
 * @param {Location} target The port to which the edges are incident. This is the target node or port of each edge.
 * @param {PortGraph} graph The graph
 * @returns {Edge[]} An array of all ingoing (i.e. pointsTo(port)) incident edges.
 */
export function inIncidents (target, graph) {
  return edges(graph).filter(pointsTo(target, graph))
}

/**
 * Gets the ingoing incident edge to a port. Each port can only have one ingoing edge.
 * @param {Location} target The node or port to which the edge is incident. This is the target node or port of the edge.
 * @param {PortGraph} graph The graph
 * @returns {Edge} The ingoing incident edge.
 */
export function inIncident (target, graph) {
  return inIncidents(target, graph)[0]
}

/**
 * Gets all outgoing incident edges to a port. The given port or node is the source of each edge.
 * @param {Location} source The port from which the edge comes. This is the source node or port of the edge.
 * @param {PortGraph} graph The graph
 * @returns {Edge[]} An array of all outgoing (i.e. isFrom(port)) incident edges.
 */
export function outIncidents (source, graph) {
  return edges(graph).filter(isFrom(source, graph))
}

/**
 * Get the successors of one node in the graph, optionally for a specific port.
 * @param {Location} source The source from which to follow the edges.
 * @param {PortGraph} graph The graph.
 * @returns {Port[]} A list of ports that succeed the node with their corresponding nodes.
 */
export function successors (source, graph) {
  return map('to')(outIncidents(source, graph))
}

function or (fn1, fn2) {
  return (v) => fn1(v) || fn2(v)
}

/**
 * @function
 * @name incidents
 * @description All incident edges to the given input.
 * @param {Location} loc The node or port.
 * @param {PortGraph} graph The graph
 * @returns {Edge[]} An array of all incident edges to the given location.
 */
export const incidents = curry((loc, graph) => {
  return edges(graph).filter(or(isFrom(loc, graph), pointsTo(loc, graph)))
})
