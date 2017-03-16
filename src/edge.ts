/**
 * Accessible via `require('@buggyorg/graphtools').Edge`
 * @module Edge */

import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import * as _ from 'lodash'
import * as Port from './port'
import * as Node from './node'

export interface DataflowEdge {
  from: Port.Port
  to: Port.Port
  layer: 'dataflow'
  innerCompoundOutput?: boolean
  innerCompoundInput?: boolean
  type?: any
  parent?: string[]
}

interface EdgeQuery {
  from: any
  to: any
  layer?: string
  innerCompoundOutput?: boolean
  innerCompoundInput?: boolean
}

export interface NodeEdge {
  from: string
  to: string
  layer: string
  innerCompoundOutput?: boolean
  innerCompoundInput?: boolean
  type?: any
  parent?: string[]
}

export type Edge = NodeEdge | DataflowEdge | (NodeEdge & DataflowEdge)
export type BasicEdge = Edge | EdgeQuery

function normalizeStructure (edge:BasicEdge):Edge {
  if (!_.has(edge, 'from') || !_.has(edge, 'to')) {
    throw new Error('The edge format is not valid. You need to have a from and to value in.\n\n' + JSON.stringify(edge, null, 2) + '\n')
  }
  var layer = edge.layer || 'dataflow'
  if (layer !== 'dataflow') {
    var newEdge = _.clone(edge)
    if (Node.isValid(edge.from)) {
      newEdge.from = Node.id((<NodeEdge>edge).from)
    }
    if (Node.isValid(edge.to)) {
      newEdge.to = Node.id((<NodeEdge>edge).to)
    }
    return <NodeEdge>newEdge
  }
  if ((typeof (edge.from) === 'string' && edge.from[0] === '/') ||
    (typeof (edge.to) === 'string' && edge.to[0] === '/')) {
    return <DataflowEdge>merge(edge, {query: true,
        from: (Port.isPort(edge.from)) ? Port.normalize(edge.from) : edge.from,
        to: (Port.isPort(edge.to)) ? Port.normalize(edge.to) : edge.to
      })
  } else if (Port.isPort(edge.from) && Port.isPort(edge.to)) {
    return <DataflowEdge>{ from: Port.normalize(edge.from), to: Port.normalize(edge.to), layer }
  }else {
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
export function normalize (edge:BasicEdge):Edge {
  var newEdge = normalizeStructure(edge)
  if (newEdge.layer === 'dataflow') {
    if (Port.node((<DataflowEdge>newEdge).from).length === 0) {
      newEdge.innerCompoundOutput = true
    }
    if (Port.node((<DataflowEdge>newEdge).to).length === 0) {
      newEdge.innerCompoundInput = true
    }
  }
  return newEdge
}

export function isEdgeToParent (edge:Edge) {
  return edge.innerCompoundInput
}

export function isInnerEdge (edge:Edge) {
  return !edge.innerCompoundInput && !edge.innerCompoundOutput
}

export function isEdgeFromParent (edge:Edge) {
  return edge.innerCompoundOutput
}

/**
 * @description Checks whether two normalized edges are equal.
 * @param {Edge} edge1 The first edge for the comparison.
 * @param {Edge} edge2 The second edge for the comparison.
 * @returns {boolean} True if the edges are equal (i.e. they connect the same ports), false otherwise.
 */
export function equal (edge1:Edge, edge2:Edge) {
  if (edge1.layer === 'dataflow' && edge2.layer === 'dataflow') {
    const dFlowEdge1 = edge1 as DataflowEdge
    const dFlowEdge2 = edge2 as DataflowEdge
    return Port.node(dFlowEdge1.from) === Port.node(dFlowEdge2.from) && Port.node(dFlowEdge1.to) === Port.node(dFlowEdge2.to) &&
      Port.portName(dFlowEdge1.from) === Port.portName(dFlowEdge2.from) && Port.portName(dFlowEdge1.to) === Port.portName(dFlowEdge2.to) &&
      edge1.layer === edge2.layer
  } else if (edge1.layer !== 'dataflow' && edge2.layer !== 'dataflow') {
    return edge1.from === edge2.from && edge1.to === edge2.to && edge1.layer === edge2.layer
  }
  return false
}

/**
 * Gets the type of an edge. Note that not every edge must have a type and that the type is not stored inside the json document.
 * If you use the graph functions to iterate over edges you always get the type (if available) with the edge.
 * @example <caption>Get an edge via a graph method and then get its edge.</caption>
 * var edge = Graph.incident(port, graph)
 * var type = Edge.type(edge)
 * @example <caption>It will yield undefined if you simply access an edge in the json document, do not do that.</caption>
 * var edge = graph.edges[0]
 * //this will return undefined
 * var type = Edge.type(edge) // = undefined
 * @param {Edge} edge The edge to use.
 * @returns {Type|undefined} Either a real type, a typename or `undefined`. Some edges do not have type information. Usually non-dataflow edges like
 * recursion indicators. Those will yield `undefined`.
 */
export function type (edge:Edge) {
  return edge.type
}

/**
 * Explicitly sets the type of the edge. The type of an edge is determined by the connecting ports.
 * @param {Type} type The type of the edge.
 * @param {Edge} edge The edge that should get the type.
 * @returns {Edge} A new edge that has a field for the type.
 */
export function setType (type, edge:Edge):Edge {
  if (isBetweenPorts(edge)) {
    return merge(edge, {
      type,
      from: Port.setType(type, (<DataflowEdge>edge).from),
      to: Port.setType(type, (<DataflowEdge>edge).to)
    })
  } else if (!isBetweenNodes(edge)) {
    throw new Error('[Edge.setType] Cannot handle mixed edges (from port to node or from node into port)')
  }
  return merge({type}, edge)
}


/**
 * Checks whether an object is a valid edge.
 * @param {Object} edge The object to test.
 * @returns {Boolean} True if the object is an edge, false otherwise.
 */
export function isValid (edge):boolean {
  return typeof (edge) === 'object' && edge.from && edge.to
}

/**
 * Checks if the edge connects two ports.
 * @param {Edge} edge The edge to test
 * @returns {Boolean} True if the edge connects two ports, false otherwise.
 */
export function isBetweenPorts (edge:Edge):boolean {
  return typeof (edge) === 'object' &&
    Port.isValid(Object.assign({type: '-', kind: 'input'}, <any>edge.from)) &&
    Port.isValid(Object.assign({type: '-', kind: 'output'}, <any>edge.to))
}

/**
 * Checks if the edge connects two nodes (and not ports of those nodes).
 * @param {Edge} edge The edge to test
 * @returns {Boolean} True if the edge connects two nodes, false otherwise (e.g. if it is an edge between ports).
 */
export function isBetweenNodes (edge:Edge):boolean {
  return isValid(edge) && !isBetweenPorts(edge)
}
