
import find from 'lodash/fp/find'
import curry from 'lodash/fp/curry'
import * as Port from '../port'
import * as Node from '../node'
import * as Edge from '../edge'
import {node, hasNode} from './node'
import * as changeSet from '../changeSet'

/**
 * Returns a list of edges in the graph.
 * @param {PortGraph} graph The graph.
 * @returns {Edges[]} A list of edges.
 */
export function edges (graph) {
  return graph.edges
}

function checkEdge (graph, edge) {
  var normEdge = Edge.normalize(graph, edge)
  var from = node(graph, normEdge.from)
  var to = node(graph, normEdge.to)
  // TODO: check for edge from parent node is not correct anymore.. normEdge.from is a port object. (Same holds for normEdge.to)
  if (normEdge.from !== '' && !hasNode(normEdge.from, graph)) {
    throw new Error('Cannot create edge connection from not existing node: ' + Port.toString(normEdge.from) + ' to: ' + Port.toString(normEdge.to))
  } else if (normEdge.to !== '' && !hasNode(normEdge.to, graph)) {
    throw new Error('Cannot create edge connection from: ' + Port.toString(normEdge.from) + ' to not existing node: ' + Port.toString(normEdge.to))
  } else if (Port.equal(normEdge.from, normEdge.to)) {
    throw new Error('Cannot add loops to the port graph from=to=' + Port.toString(normEdge.from))
  } else if (!Node.isReference(from) && !Node.hasPort(from, normEdge.from)) {
    throw new Error('The source node "' + Port.node(normEdge.from) + '" does not have the outgoing port "' + Port.portName(normEdge.outPort) + '".')
  } else if (!Node.isReference(from) && !Node.hasPort(to, normEdge.to)) {
    throw new Error('The target node "' + Port.node(normEdge.to) + '" does not have the ingoing port "' + Port.portName(normEdge.inPort) + '".')
  } else if (!Node.isReference(from) && (Node.port(from, normEdge.from).kind !== ((normEdge.innerCompoundOutput) ? 'input' : 'output'))) {
    throw new Error('The source port "' + Port.portName(normEdge.from) + '" = "' + JSON.stringify(Node.port(from, normEdge.from)) + '" must be ' +
    ((normEdge.innerCompoundEdge)
    ? 'an inner input port of the compound node ' + normEdge.parent
    : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
  } else if (!Node.isReference(from) && (Node.port(to, normEdge.to).kind !== ((normEdge.innerCompoundInput) ? 'output' : 'input'))) {
    throw new Error('The target port "' + Port.portName(normEdge.to) + '" = "' + JSON.stringify(Node.port(to, normEdge.to)) + ' must be ' +
      ((normEdge.innerCompoundEdge)
      ? 'an inner output port of the compound node ' + normEdge.parent
      : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
  }
}

/**
 * Add an edge to the graph, either by specifying the ports to connect.
 * @param {Edge} edge The edge that should be added. This needn't be in standard format.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph containing the edge.
 * @throws {Error} If:
 *  - the edge already exists
 *  - ports that the edge connects do not exists
 *  - nodes that the edge connects do not exists
 *  - the edge is not in normalizable form.
 */
export const addEdge = curry((edge, graph) => {
  if (hasEdge(edge, graph)) {
    throw new Error('Cannot create already existing edge: ' + JSON.stringify(edge))
  }
  var normEdge = Edge.normalize(graph, edge)
  checkEdge(graph, edge)
  return changeSet.applyChangeSet(graph, changeSet.insertEdge(normEdge))
})

/**
 * Checks whether the graph has the given edge.
 * @params {Edge} edge The edge to look for.
 * @params {PortGraph} graph The graph.
 * @returns {boolean} True if the edge is contained in the graph, false otherwise.
 */
export const hasEdge = curry((graph, edge) => {
  var normEdge = Edge.normalize(graph, edge)
  return !!find(graph.edges, Edge.equal(normEdge))
})

/**
 * Returns the queried edge.
 * @params {Edge} edge A edge mock that only contains the connecting ports but not necessarily further information.
 * @params {PortGraph} graph The graph.
 * @returns {Edge} The edge as it is stored in the graph.
 * @throws {Error} If the edge is not contained in the graph.
 */
export const edge = curry((graph, edge) => {
  var normEdge = Edge.normalize(graph, edge)
  var retEdge = find(graph.edges, Edge.equal(normEdge))
  if (!retEdge) {
    throw new Error('Edge is not defined in the graph: ' + JSON.stringify(edge))
  }
  return retEdge
})
