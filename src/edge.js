/** @module Edge */

import _ from 'lodash'
import * as Node from './node'

function isPortNotation (port) {
  return port.indexOf('@') !== -1
}

function parsePortNotation (graph, port) {
  var split = port.split('@')
  var res = {}
  res.node = split[0]
  if (split[1] === '') {
    throw new Error('Invalid port notation. Port notation does not contain a port. Parsed port: ' + port)
  } else {
    res.port = split[1]
  }
  return res
}

function normalizeStructure (graph, edge) {
  if (!_.has(edge, 'from') || !_.has(edge, 'to')) {
    throw new Error('The edge format is not valid. You need to have a from and to value in.\n\n' + JSON.stringify(edge, null, 2) + '\n')
  }
  var layer = edge.layer || 'dataflow'
  if (edge.outPort && edge.inPort) {
    return _.merge({}, edge, {layer, from: Node.pathNormalize(edge.from), to: Node.pathNormalize(edge.to)})
  } else if (edge.fromPort && edge.toPort) {
    return { from: Node.pathNormalize(edge.from), to: Node.pathNormalize(edge.to), outPort: edge.fromPort, inPort: edge.toPort, layer }
  } else if (!edge.outPort && !edge.inPort && !edge.fromPort && !edge.toPort &&
    isPortNotation(edge.from) && isPortNotation(edge.to)) {
    var from = parsePortNotation(graph, edge.from)
    var to = parsePortNotation(graph, edge.to)
    return { from: Node.pathNormalize(from.node), to: Node.pathNormalize(to.node), outPort: from.port, inPort: to.port, layer }
  } else {
    throw new Error('Malformed edge. Cannot translate format into standard format.\nEdge: ' + JSON.stringify(edge))
  }
}

/*
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
}*/

/**
 * Normalizes the edge into the standard format
 *
 *  {from: '<node>', to: '<node>', outPort: '<port>', inPort: '<port>'}
 *
 * It accepts the following short forms:
 *
 *  {from: '<node>@<port>', to: '<node>@<port>'}
 *  {from: '@<port>', to: '<node>@<port>'}
 *  {from: '<node>@<port>', to: '@<port>'}
 *  {from: '@<port>', to: '@<port>'}
 *  {from: '<node>', to: '<node>', fromPort: '<port>', toPort: '<port>'}
 *
 * The format must be consistent, you cannot have a mixture between from and to.
 *
 * @param {PortGraph} graph The graph in which the port should connect ports.
 * @param {Edge} edge The edge object that should be normalized.
 * @returns {Edge} The normalized form of the edge.
 * @throws {Error} An error is thrown if either:
 *  - the edge is not in a consistent format,
 *  - the nodes do not exist,
 *  - the ports do not exits,
 *  - there is no consistent parent for this edge.
 */
export function normalize (graph, edge) {
  var newEdge = normalizeStructure(graph, edge, graph)
  if (Node.isValid(graph) && newEdge.from.length === 0) {
    newEdge.innerCompoundOutput = true
  }
  if (Node.isValid(graph) && newEdge.to.length === 0) {
    newEdge.innerCompoundInput = true
  }
  newEdge.parent = Node.path(graph)
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

/**
 * Returns a copy of the edge where the path is prefixed with the specified path.
 * @param {Edge} edge The edge that will be prefixed
 * @param {CompoundPath} path The compound path that prefixes the edge paths.
 * @returns {Edge} A new edge that has the prefixed paths.
 */
export function setPath (edge, path) {
  return _.merge({}, edge,
    {
      parent: _.compact(_.concat(path, edge.parent)),
      from: _.compact(_.concat(path, edge.from)),
      to: _.compact(_.concat(path, edge.to))
    })
}
