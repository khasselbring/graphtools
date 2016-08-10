/** @module Edge */

import * as Graph from './graph'
import _ from 'lodash'

function isPortNotation (port) {
  return port.indexOf('@') !== -1
}

function parsePortNotation (graph, port, parent) {
  var split = port.split('@')
  var res = {}
  if (split[0] !== '') {
    res.node = split[0]
  } else if (parent) {
    res.node = parent
  } else {
    throw new Error('Cannot process port notation. Parent required, but not specified. Parsed port: ' + port)
  }
  if (split[1] === '') {
    throw new Error('Invalid port notation. Port notation does not contain a port. Parsed port: ' + port)
  } else {
    res.port = split[1]
  }
  return res
}

function normalizeStructure (graph, edge, parent) {
  if (!edge.from || !edge.to) {
    throw new Error('The edge format is not valid. You need to have a from and to value in.\n\n' + JSON.stringify(edge, null, 2) + '\n')
  }
  parent = parent || edge.parent
  var layer = edge.layer || 'dataflow'
  if (edge.outPort && edge.inPort) {
    if (parent && !Graph.hasNode(graph, parent)) {
      throw new Error('No valid information about the parent of the edge given.\nEdge ' + JSON.stringify(edge) + '\nParent: ' + parent)
    }
    return _.merge({}, edge, {parent, layer})
  } else if (edge.fromPort && edge.toPort) {
    return { from: edge.from, to: edge.to, outPort: edge.fromPort, inPort: edge.toPort, parent, layer }
  } else if (!edge.outPort && !edge.inPort && !edge.fromPort && !edge.toPort &&
    isPortNotation(edge.from) && isPortNotation(edge.to)) {
    var from = parsePortNotation(graph, edge.from, parent)
    var to = parsePortNotation(graph, edge.to, parent)
    return { from: from.node, to: to.node, outPort: from.port, inPort: to.port, parent, layer }
  } else {
    throw new Error('Malformed edge. Cannot translate format into standard format.\nEdge: ' + JSON.stringify(edge))
  }
}

function determineParent (graph, edge) {
  var fromParent = Graph.parent(graph, edge.from)
  var toParent = Graph.parent(graph, edge.to)
  if (fromParent === toParent) {
    return fromParent
  } else if (fromParent === edge.to) {
    return fromParent
  } else if (toParent === edge.from) {
    return toParent
  } else {
    throw new Error('Unable to determine the parent of the edge: ' + JSON.stringify(edge) +
      '\nParent of ' + edge.from + ': ' + fromParent +
      '\nParent of ' + edge.to + ': ' + toParent)
  }
}

/**
 * Normalizes the edge into the standard format
 *
 *  {from: '<node>', to: '<node>', outPort: '<port>', inPort: '<port>'}
 *
 * It accepts the following short forms:
 *
 *  {from: '<node>@<port>', to: '<node>@<port>'}
 *  {from: '@<port>', to: '<node>@<port>'}    Needs parent!
 *  {from: '<node>@<port>', to: '@<port>'}    Needs parent!
 *  {from: '@<port>', to: '@<port>'}          Needs parent!
 *  {from: '<node>', to: '<node>', fromPort: '<port>', toPort: '<port>'}
 *
 * The format must be consistent, you cannot have a mixture between from and to.
 *
 * @param {PortGraph} graph The graph in which the port should connect ports.
 * @param {Edge} edge The edge object that should be normalized.
 * @param {Node} [parent] An optional parent if the short notation without nodes is used.
 * @returns {Edge} The normalized form of the edge.
 * @throws {Error} An error is thrown if either:
 *  - the edge is not in a consistent format,
 *  - the nodes do not exist,
 *  - the ports do not exits,
 *  - there is no consistent parent for this edge.
 */
export function normalize (graph, edge, parent) {
  var newEdge = normalizeStructure(graph, edge, parent)
  if (!newEdge.parent) {
    newEdge = _.merge({}, newEdge, {parent: determineParent(graph, newEdge)})
  }
  if (newEdge.parent === newEdge.from) {
    newEdge.innerCompoundOutput = true
  }
  if (newEdge.parent === newEdge.to) {
    newEdge.innerCompoundInput = true
  }
  return newEdge
}

/**
 * Checks whether two normalized nodes are equal.
 * @param {Edge} edge1 The first edge for the comparison.
 * @param {Edge} edge2 The second edge for the comparison.
 * @returns {boolean} True if the edges are equal (i.e. they connect the same ports), false otherwise.
 */
export function equal (edge1, edge2) {
  return edge1.from === edge2.from && edge1.outPort === edge2.outPort &&
    edge1.to === edge2.to && edge1.inPort === edge2.inPort
}
