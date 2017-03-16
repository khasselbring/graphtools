
import {find, map, curry, merge} from 'lodash/fp'
import * as Edge from '../edge'
import {edgesDeep} from './edge'
import {query} from '../location'
import {node, port, hasPort} from '../graph/node'
import {Node} from '../node'
import {kind, Port} from '../port'
import {Portgraph} from './graph'
import {Location} from '../location'

/**
 * @description Checks whether an edge points to a given target.
 * @param {Location} target The target the edge should point to. This can either be a node or a port.
 * @param {PortGraph} graph The graph
 * @param {Edge} edge The edge to check
 * @returns {boolean} True if the edge points to the target, false otherwise.
 */
export function pointsTo (target) {
  return (graph:Node, edge:Edge.Edge) => {
    var q = query(target, graph)
    if (typeof (edge.to) === 'string') {
      return q(node(edge.to, graph))
    }
    return q(merge(edge.to, {additionalInfo: node(edge.to, graph)}))
  }
}

/**
 * @description Checks whether an edge is from a given source.
 * @param {Location} target The source the edge should come from. This can either be a node or a port.
 * @param {PortGraph} graph The graph
 * @param {Edge} edge The edge to check
 * @returns {boolean} True if the edge comes from the source, false otherwise.
 */
export function isFrom (source) {
  return (graph:Node, edge:Edge.Edge) => {
    var q = query(source, graph)
    if (typeof (edge.from) === 'string') {
      return q(node(edge.from, graph))
    }
    return q(merge(edge.from, {additionalInfo: node(edge.from, graph)}))
  }
}

/**
 * Checks whether the two nodes or ports are connected via an edge.
 * @param {Location} nodeFrom The starting point of our connection.
 * @param {Location} nodeTo The target of our connection.
 * @param {PortGraph} graph The graph in which we want to find the connection.
 * @returns {boolean} True if the graph has an edge going from "nodeFrom" to "nodeTo".
 */
export function areConnected (nodeFrom, nodeTo, graph:Node) {
  return !!find(edgesDeep(graph), (e) => isFrom(nodeFrom)(graph, e) && pointsTo(nodeTo)(graph, e))
}

/**
 * Returns a list of predecessors for a node or a port. Each node can only have exactly one
 * predecessor for every port but this function always returns a list.
 * @param {Location} target The target to which the predecessors point.
 * @param {PortGraph} graph The graph.
 * @param {Boolean} [goIntoCompounds] Optional argument that activates looking for edges inside compounds.
 * If you specify a node as the location it will not go inside the node (if it is a compound) and look for
 * predecessors inside the compound.
 * @returns {Port[]} A list of ports with that are predecessors of `target`
 */
export function predecessors (target, graph:Node, goIntoCompounds = false):Port[] {
  return map('from')(inIncidents(target, graph, goIntoCompounds))
}

/**
 * Returns the predecessors for a node or a port. Each node can only have exactly one
 * predecessor for every port.
 * @param {Location} target The target to which the predecessors points.
 * @param {PortGraph} graph The graph.
 * @param {Boolean} [goIntoCompounds] Optional argument that activates looking for edges inside compounds.
 * If you specify a node as the location it will not go inside the node (if it is a compound) and look for
 * a predecessor inside the compound.
 * @returns {Port} The preceeding port
 */
export function predecessor (target, graph:Node, goIntoCompounds = false) {
  return predecessors(target, graph, goIntoCompounds)[0]
}

/**
 * Gets all ingoing incident edges to a port
 * @param {Location} target The port to which the edges are incident. This is the target node or port of each edge.
 * @param {PortGraph} graph The graph
 * @param {Boolean} [goIntoCompounds] Optional argument that activates looking for edges inside compounds.
 * If you specify a node as the location it will not go inside the node (if it is a compound) and look for
 * ingoing edges inside the compound.
 * @returns {Edge[]} An array of all ingoing (i.e. pointsTo(port)) incident edges.
 */
export function inIncidents (target, graph:Node, goIntoCompounds = false) {
  return edgesDeep(graph).filter((e) => pointsTo(target)(graph, e) &&
    (goIntoCompounds || hasPort(target, graph) || kind(port(e.to as Port, graph)) === 'input'))
}

/**
 * Gets the ingoing incident edge to a port. Each port can only have one ingoing edge.
 * @param {Location} target The node or port to which the edge is incident. This is the target node or port of the edge.
 * @param {PortGraph} graph The graph
 * @param {Boolean} [goIntoCompounds] Optional argument that activates looking for edges inside compounds.
 * If you specify a node as the location it will not go inside the node (if it is a compound) and look for
 * ingoing edges inside the compound.
 * @returns {Edge} The ingoing incident edge.
 */
export function inIncident (target, graph:Node, goIntoCompounds = false) {
  return inIncidents(target, graph, goIntoCompounds)[0]
}

/**
 * Gets all outgoing incident edges to a port. The given port or node is the source of each edge.
 * @param {Location} source The port from which the edge comes. This is the source node or port of the edge.
 * @param {PortGraph} graph The graph
 * @param {Boolean} [goIntoCompounds] Optional argument that activates looking for edges inside compounds.
 * If you specify a node as the location it will not go inside the node (if it is a compound) and look for
 * outgoing edges inside the compound.
 * @returns {Edge[]} An array of all outgoing (i.e. isFrom(port)) incident edges.
 */
export function outIncidents (source, graph:Node, goIntoCompounds = false) {
  return edgesDeep(graph).filter((e) => isFrom(source)(graph, e) &&
    (goIntoCompounds || hasPort(source, graph) || kind(port(e.from as Port, graph)) === 'output'))
}

/**
 * Get the successors of one node in the graph, optionally for a specific port.
 * @param {Location} source The source from which to follow the edges.
 * @param {PortGraph} graph The graph.
 * @param {Boolean} [goIntoCompounds] Optional argument that activates looking for edges inside compounds.
 * If you specify a node as the location it will not go inside the node (if it is a compound) and look for
 * successors inside the compound.
 * @returns {Port[]} A list of ports that succeed the node with their corresponding nodes.
 */
export function successors (source, graph:Node, goIntoCompounds = false):Port[] {
  return map('to')(outIncidents(source, graph, goIntoCompounds))
}

/**
 * @description All incident edges to the given input.
 * @param {Location} loc The node or port.
 * @param {PortGraph} graph The graph
 * @returns {Edge[]} An array of all incident edges to the given location.
 */
export function incidents (loc, graph:Node) {
  return edgesDeep(graph).filter((e) => isFrom(loc)(graph, e) || pointsTo(loc)(graph, e))
}
