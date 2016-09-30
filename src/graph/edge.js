
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

/**
 * Returns a list of edges in the graph.
 * @param {PortGraph} graph The graph.
 * @returns {Edges[]} A list of edges.
 */
export function edges (graph) {
  return compact(flatten(map('edges', nodesDeep(graph).concat([graph]))))
}

function checkEdge (graph, edge) {
  var from = node(edge.from, graph)
  var to = node(edge.to, graph)
  // TODO: check for edge/ from parent node is not correct anymore.. normEdge.from is a port object. (Same holds for normEdge.to)
  if (edge.from.node !== '' && !hasNode(edge.from, graph)) {
    throw new Error('Cannot create edge connection from not existing node: ' + Port.toString(edge.from) + ' to: ' + Port.toString(edge.to))
  } else if (edge.to.node !== '' && !hasNode(edge.to, graph)) {
    throw new Error('Cannot create edge connection from: ' + Port.toString(edge.from) + ' to not existing node: ' + Port.toString(edge.to))
  }
  if (edge.layer === 'dataflow') {
    if (Port.equal(edge.from, edge.to)) {
      throw new Error('Cannot add loops to the port graph from=to=' + Port.toString(edge.from))
    } else if (!Node.isReference(from) && !Node.hasPort(edge.from, from)) {
      throw new Error('The source node "' + Port.node(edge.from) + '" does not have the outgoing port "' + Port.portName(edge.from) + '".')
    } else if (!Node.isReference(from) && !Node.hasPort(edge.to, to)) {
      throw new Error('The target node "' + Port.node(edge.to) + '" does not have the ingoing port "' + Port.portName(edge.inPort) + '".')
    } else if (!Node.isReference(from) && (Node.port(edge.from, from).kind !== ((edge.innerCompoundOutput) ? 'input' : 'output'))) {
      throw new Error('The source port "' + Port.portName(edge.from) + '" = "' + JSON.stringify(Node.port(edge.from, from)) + '" must be ' +
      ((edge.innerCompoundOutput)
      ? 'an inner input port of the compound node ' + edge.parent
      : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
    } else if (!Node.isReference(from) && (Node.port(edge.to, to).kind !== ((edge.innerCompoundInput) ? 'output' : 'input'))) {
      throw new Error('The target port "' + Port.portName(edge.to) + '" = "' + JSON.stringify(Node.port(edge.to, to)) + ' must be ' +
        ((edge.innerCompoundInput)
        ? 'an inner output port of the compound node ' + edge.parent
        : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
    }
  }
}

function pathsToIDs (edge, graph) {
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
    throw new Error('Unable to determine parent for the edge:', JSON.stringify(edge))
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

function normalize (edge, graph) {
  var normEdge = Edge.normalize(edge)
  return setInnerCompound(pathsToIDs(normEdge, graph), graph)
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
  var normEdge = normalize(edge, graph)
  checkEdge(graph, normEdge)
  return addEdgeToCompound(normEdge, graph)
})

export const removeEdge = curry((edge, graph) => {
  var normEdge = normalize(edge, graph)
  if (!hasEdge(normEdge, graph)) {
    throw new Error('Cannot delete edge that is not in the graph.')
  }
  return changeSet.applyChangeSet(graph, changeSet.removeEdge(normEdge))
})

/**
 * Checks whether the graph has the given edge.
 * @params {Edge} edge The edge to look for.
 * @params {PortGraph} graph The graph.
 * @returns {boolean} True if the edge is contained in the graph, false otherwise.
 */
export const hasEdge = curry((edge, graph) => {
  var normEdge = normalize(edge, graph)
  return !!find(Edge.equal(normEdge), edges(graph))
})

/**
 * Returns the queried edge.
 * @params {Edge} edge A edge mock that only contains the connecting ports but not necessarily further information.
 * @params {PortGraph} graph The graph.
 * @returns {Edge} The edge as it is stored in the graph.
 * @throws {Error} If the edge is not contained in the graph.
 */
export const edge = curry((edge, graph) => {
  var normEdge = normalize(edge, graph)
  var retEdge = find(Edge.equal(normEdge), edges(graph))
  if (!retEdge) {
    throw new Error('Edge is not defined in the graph: ' + JSON.stringify(edge))
  }
  return retEdge
})
