
import find from 'lodash/fp/find'
import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import map from 'lodash/fp/map'
import flatten from 'lodash/fp/flatten'
import compact from 'lodash/fp/compact'
import * as Port from '../port'
import * as Node from '../node'
import * as Edge from '../edge'
import {equal, isRoot} from '../compoundPath'
import {node, hasNode, nodesDeep, parent, replaceNode} from './node'
import * as changeSet from '../changeSet'
import {location, identifies as locIdentifies} from '../location'

/**
 * Returns a list of edges in the graph.
 * @param {PortGraph} graph The graph.
 * @returns {Edges[]} A list of edges.
 */
export function edges (graph) {
  return compact(flatten(map('edges', nodesDeep(graph).concat([graph]))))
}

export const checkEdge = curry((graph, edge) => {
  var from = node(edge.from, graph)
  var to = node(edge.to, graph)
  // TODO: check for edge/ from parent node is not correct anymore.. normEdge.from is a port object. (Same holds for normEdge.to)
  if (edge.from.node !== '' && !hasNode(edge.from, graph)) {
    throw new Error('Cannot create edge connection from not existing node: ' + Port.toString(edge.from) + ' to: ' + Port.toString(edge.to))
  } else if (edge.to.node !== '' && !hasNode(edge.to, graph)) {
    throw new Error('Cannot create edge connection from: ' + Port.toString(edge.from) + ' to not existing node: ' + Port.toString(edge.to))
  }
  if (edge.layer === 'dataflow') {
    if (typeof (edge.from) === 'string' || typeof (edge.to) === 'string') {
      throw new Error('A normalized edge is expected. No short-fort edges are allowed: ' + JSON.stringify(edge))
    } else if (Port.equal(edge.from, edge.to)) {
      throw new Error('Cannot add loops to the port graph from=to=' + Port.toString(edge.from))
    } else if (!Node.isReference(from) && !Node.hasPort(edge.from, from)) {
      throw new Error('The source node "' + Port.node(edge.from) + '" does not have the outgoing port "' + Port.portName(edge.from) + '".')
    } else if (!Node.isReference(to) && !Node.hasPort(edge.to, to)) {
      throw new Error('The target node "' + Port.node(edge.to) + '" does not have the ingoing port "' + Port.portName(edge.to) + '".')
    } else if (!Node.isReference(from) && (Node.port(edge.from, from).kind !== ((edge.innerCompoundOutput) ? 'input' : 'output'))) {
      throw new Error('The source port "' + Port.portName(edge.from) + '" = "' + JSON.stringify(Node.port(edge.from, from)) + '" must be ' +
      ((edge.innerCompoundOutput)
      ? 'an inner input port of the compound node ' + edgeParent(edge, graph)
      : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
    } else if (!Node.isReference(to) && (Node.port(edge.to, to).kind !== ((edge.innerCompoundInput) ? 'output' : 'input'))) {
      throw new Error('The target port "' + Port.portName(edge.to) + '" = "' + JSON.stringify(Node.port(edge.to, to)) + ' must be ' +
        ((edge.innerCompoundInput)
        ? 'an inner output port of the compound node ' + edge.parent
        : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
    }
  } else if (!edge.layer) {
    throw new Error('Edge must have a layer attribute: ' + JSON.stringify(edge))
  }
})

function pathsToIDs (edge, graph) {
  if (edge.query) return edge
  var from = node(edge.from, graph)
  var to = node(edge.to, graph)
  if (edge.layer === 'dataflow') {
    return merge(edge, {
      from: {node: Node.id(from)},
      to: {node: Node.id(to)}
    })
  } else {
    return merge(edge, {from: Node.id(from), to: Node.id(to)})
  }
}

function edgeParent (edge, graph) {
  var parentFrom = Node.path(parent(edge.from, graph))
  var parentTo = Node.path(parent(edge.to, graph))
  if (equal(parentFrom, parentTo)) {
    return parentFrom // = parentTo
  } else if (equal(Node.path(node(edge.from, graph)), parentTo)) {
    return parentTo
  } else if (equal(Node.path(node(edge.to, graph)), parentFrom)) {
    return parentFrom
  } else {
    if (edge.layer !== 'dataflow') {
      // TODO is there any sensible parent for an arbitrary edge?
      return parentFrom
    }
    throw new Error('Unable to determine parent for the edge:' + JSON.stringify(edge))
  }
}

function setInnerCompound (edge, graph) {
  if (edge.layer !== 'dataflow') return edge
  var parentFrom = Node.path(parent(edge.from, graph))
  var parentTo = Node.path(parent(edge.to, graph))
  var from = Node.path(node(edge.from, graph))
  var to = Node.path(node(edge.to, graph))
  if (equal(from, to) && equal(parentFrom, parentTo)) {
    return merge(edge, {innerCompoundInput: true, innerCompoundOutput: true})
  } else if (equal(from, parentTo)) {
    return merge(edge, {innerCompoundOutput: true})
  } else if (equal(to, parentFrom)) {
    return merge(edge, {innerCompoundInput: true})
  } else if (equal(parentFrom, parentTo)) {
    return edge
  } else {
    throw new Error('Unable to determine parent for the edge:', JSON.stringify(edge))
  }
}

function unIDPort (port, inner, graph) {
  var fromNode = node(port, graph)
  if (!Number.isNaN(parseInt(Port.portName(port)))) {
    if (Node.ports(fromNode).length === 0 && Node.isReference(fromNode)) return port
    var portId = parseInt(Port.portName(port))
    var ports = Node[inner ? 'inputPorts' : 'outputPorts'](fromNode, true)
    if (portId >= ports.length) {
      throw new Error('Node does not have a ' + portId + '-th port.')
    }
    return merge(port, {port: Port.portName(ports[portId])})
  }
  return port
}

function unIDPorts (edge, graph) {
  return merge(edge, {
    from: unIDPort(edge.from, edge.innerCompoundOutput, graph),
    to: unIDPort(edge.to, !edge.innerCompoundInput, graph)})
}

function normalize (edge, graph) {
  var normEdge = Edge.normalize(edge)
  return unIDPorts(setInnerCompound(pathsToIDs(normEdge, graph), graph), graph)
}

function addEdgeToCompound (edge, graph) {
  var cs = changeSet.insertEdge(edge)
  var parent = edgeParent(edge, graph)
  if (isRoot(parent) || equal(parent, graph.path)) {
    return changeSet.applyChangeSet(graph, cs)
  } else {
    var comp = node(parent, graph)
    var newComp = changeSet.applyChangeSet(comp, cs)
    return replaceNode(parent, newComp, graph)
  }
}

/**
 * @function
 * @name addEdge
 * @description Add an edge to the graph.
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
  var normEdge = normalize(edge, graph)
  checkEdge(graph, normEdge)
  return addEdgeToCompound(normEdge, graph)
})

/**
 * @function
 * @name removeEdge
 * @description Remove an edge in the graph
 * @param {Edge} edge The edge that should be removed. This needn't be in standard format.
 * @param {PortGraph} graph The graph
 * @returns {PortGraph} A new graph that does not contain the edge anymore.
 * @throws {Error} If there is no such edge in the graph.
 */
export const removeEdge = curry((edge, graph) => {
  var normEdge = normalize(edge, graph)
  if (!hasEdge(normEdge, graph)) {
    throw new Error('Cannot delete edge that is not in the graph.')
  }
  return changeSet.applyChangeSet(graph, changeSet.removeEdge(normEdge))
})

function identifies (edge, graph) {
  if (!edge.query) return Edge.equal(edge)
  var fromLoc = location(edge.from, graph)
  var toLoc = location(edge.to, graph)
  return (cmpEdge) => locIdentifies(fromLoc, node(cmpEdge.from, graph)) &&
    (!fromLoc.port || fromLoc.port === cmpEdge.from.port) &&
    locIdentifies(toLoc, node(cmpEdge.to, graph)) &&
    (!toLoc.port || toLoc.port === cmpEdge.to.port)
}

function findEdge (edge, graph) {
  try { // TODO: improve error message when an error is thrown
    var normEdge = normalize(edge, graph)
    return find(identifies(normEdge, graph), edges(graph))
  } catch (err) {
    return null
  }
}

/**
 * @function
 * @name hasEdge
 * @description Checks whether the graph has the given edge.
 * @params {Edge} edge The edge to look for. This needn't be in standard format.
 * @params {PortGraph} graph The graph.
 * @returns {boolean} True if the edge is contained in the graph, false otherwise.
 */
export const hasEdge = curry((edge, graph) => {
  return !!findEdge(edge, graph)
})

/**
 * @function
 * @name edge
 * @description Returns the queried edge. This needn't be in standard format.
 * @params {Edge} edge A edge mock that only contains the connecting ports but not necessarily further information.
 * @params {PortGraph} graph The graph.
 * @returns {Edge} The edge as it is stored in the graph.
 * @throws {Error} If the edge is not contained in the graph.
 */
export const edge = curry((edge, graph) => {
  var retEdge = findEdge(edge, graph)
  if (!retEdge) {
    throw new Error('Edge is not defined in the graph: ' + JSON.stringify(edge))
  }
  return retEdge
})
