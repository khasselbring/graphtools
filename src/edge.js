/** @module Edge */
/**
 * @overview
 * Accessible via `require('@buggyorg/graphtools').Edge`
 */

import curry from 'lodash/fp/curry'
import _ from 'lodash'
import * as Port from './port'

function normalizeStructure (edge) {
  if (!_.has(edge, 'from') || !_.has(edge, 'to')) {
    throw new Error('The edge format is not valid. You need to have a from and to value in.\n\n' + JSON.stringify(edge, null, 2) + '\n')
  }
  var layer = edge.layer || 'dataflow'
  if (layer !== 'dataflow') {
    return edge
  }
  if (edge.outPort && edge.inPort) {
    return _.merge({}, _.omit(edge, ['outPort', 'inPort']),
      {layer, from: Port.normalize({node: edge.from, port: edge.outPort}), to: Port.normalize({node: edge.to, port: edge.inPort})})
  } else if (!edge.outPort && !edge.inPort && Port.isPort(edge.from) && Port.isPort(edge.to)) {
    return { from: Port.normalize(edge.from), to: Port.normalize(edge.to), layer }
  } else {
    throw new Error('Malformed edge. Cannot translate format into standard format.\nEdge: ' + JSON.stringify(edge))
  }
}

/**
 * Normalizes the edge into the standard format
 *
 * ```
 *  {from: '<port>', to: '<port>'}
 * ```
 *
 * It accepts the following short forms:
 *
 * ```
 *  {from: '<node>@<port>', to: '<node>@<port>'}
 *  {from: '@<port>', to: '<node>@<port>'}
 *  {from: '<node>@<port>', to: '@<port>'}
 *  {from: '@<port>', to: '@<port>'}
 *  {from: '<node>', to: '<node>', outPort: '<port-name>', inPort: '<port-name>'}
 * ```
 *
 * The format must be consistent, you cannot have a mixture for `from` and `to`.
 * It is not possible to always add those normalized edges into the graph. They must contain
 * valid IDs of the graph. Use `Graph.normalize` for this.
 *
 * @param {Edge} edge The edge object that should be normalized.
 * @returns {Edge} The normalized form of the edge.
 * @throws {Error} An error is thrown if the edge is not in a consistent format.
 */
export function normalize (edge) {
  var newEdge = normalizeStructure(edge)
  if (newEdge.from.length === 0) {
    newEdge.innerCompoundOutput = true
  }
  if (newEdge.to.length === 0) {
    newEdge.innerCompoundInput = true
  }
  return newEdge
}

/**
 * @function
 * @name equal
 * @description Checks whether two normalized edges are equal.
 * @param {Edge} edge1 The first edge for the comparison.
 * @param {Edge} edge2 The second edge for the comparison.
 * @returns {boolean} True if the edges are equal (i.e. they connect the same ports), false otherwise.
 */
export const equal = curry((edge1, edge2) => {
  if (edge1.layer === 'dataflow') {
    return Port.equal(edge1.from, edge2.from) && Port.equal(edge1.to, edge2.to) && edge1.layer === edge2.layer
  } else {
    return edge1.from === edge2.from && edge1.to === edge2.to && edge1.layer === edge2.layer
  }
})

/**
 * Returns a copy of the edge where the path is prefixed with the specified path. [Does nothing currently... can probably be removed. Is used in ./compound.js]
 * @param {Edge} edge The edge that will be prefixed
 * @param {CompoundPath} path The compound path that prefixes the edge paths.
 * @returns {Edge} A new edge that has the prefixed paths.
 */
export function setPath (edge, path) {
  return edge
}
