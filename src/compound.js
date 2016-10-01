/** @module Compound */

import omit from 'lodash/fp/omit'
import merge from 'lodash/fp/merge'
import curry from 'lodash/fp/curry'
import negate from 'lodash/fp/negate'
import {isReference, id as nodeID, hasPort, inputPorts, outputPorts, ports, component} from './node'
import * as Edge from './edge'
import * as Port from './port'
import {edges, removeEdge} from './graph/edge'
import {pointsTo, isFrom} from './graph/connections'
import {nodes} from './graph/node'
import _ from 'lodash'
import cuid from 'cuid'

/**
 * Checks whether a node is a compound node.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is a compound node, false otherwise.
 */
export function isCompound (node) {
  return !isReference(node) && !node.atomic && !!node.nodes && !!node.edges
}

/**
 * Returns whether the node is a recursion node
 * (i.e. is the node that contains the recursion implementation -- recursive root
 * or it is the the node that invokes the recursive call -- recursion invokee)
 * @params {Node} node The node that should be tested
 * @returns {boolean} True if it is a recursion node, false otherwise.
 */
export function isRecursion (node) {
  // might change in the future...
  return node.isRecursion
}

/**
 * Returns the id of the compound
 * @param {Compound} node The compound node
 * @returns {String} The id of the compound.
 */
export function id (node) {
  if (node.id) {
    return nodeID(node)
  } else return null
}

/**
 * Sets the compound path of the compound node.
 * @param {Compound} node The compound node that gets a new compound path.
 * @param {CompoundPath} path The new compound path.
 * @param {function} nodeSetPath A function that sets the path for a node.
 * @returns {Compound} The new compound with updated paths.
 */
export function setPath (node, path, nodeSetPath) {
  return _.merge({}, node,
    {path},
    // I think `nodeSetPath` is only used due to the fear of importing ./node.js here and ./compound.js in ./node.js (cyclic reference...)
    {nodes: node.nodes.map((n) => nodeSetPath(n, path))},
    {edges: node.edges.map((e) => Edge.setPath(e, path))}
  )
}

/**
 * Create a new compound either with a template, or an empty one.
 * @params {Node} node An optional node template that contains the name and ports of the compound.
 * @returns {Compound} The compound representing the given node.
 */
export function create (node) {
  node = node || {}
  return _.merge({
    nodes: [],
    metaInformation: {},
    edges: [],
    components: [],
    path: [],
    ports: [],
    atomic: false,
    id: '#' + cuid()
  }, node)
}

/**
 * @function
 * @name children
 * @description Get the children of the compound node.
 * @param {Compound} node The compound node
 * @returns {Node[]} An array of child nodes.
 */
export const children = nodes
export {hasPort, inputPorts, outputPorts, component}

const getPort = (portOrString, node) =>
  (typeof (portOrString) === 'string') ? Port.create(node, portOrString, null) : merge({node: node.id}, portOrString)

/**
 * @function
 * @name renamePort
 * @description Rename a port and return the new node.
 * @param {String|Port} port the Port to rename.
 * @returns {Node} The node with the renamed port. The componentId will be removed, as it is not
 * an implementation of the component anymore.
 */
export const renamePort = curry((port, newName, node) => {
  port = getPort(port, node)
  return omit('componentId', merge(node, {ports: node.ports.map((p) => {
    if (Port.equal(port, p)) {
      return merge(p, {port: newName})
    } else return p
  })}))
})

/**
 * @function
 * @name removePort
 * @description Remove a port from a node
 * @param {Port|String} port The port to remove
 * @returns {Node} The node without the given port. The componentId will be removed, as it is not
 * an implementation of the component anymore.
 */
export const removePort = curry((port, node) => {
  port = getPort(port, node)
  var portEdges = edges(node).filter((e) => pointsTo(port, node, e) || isFrom(port, node, e))
  var newNode = portEdges.reduce((cmp, edge) => removeEdge(edge, cmp), node)
  return merge(omit(['ports', 'componentId'], newNode),
    {ports: ports(newNode).filter(negate((p) => Port.equal(port, p)))})
})

const addPort = (port, kind, node) => {
  if (hasPort(port, node)) {
    throw new Error('Cannot add already existing port ' + Port.toString(port) + ' to node.')
  }
  return omit('componentId',
    merge(node, {ports: node.ports.concat([Port.create(node.id, port.port, kind)])}))
}

/**
 * @function
 * @name addInputPort
 * @description Adds a new input port to the node.
 * @params {Port|String} port The port to add.
 * @params {Node} node The node that gets the port.
 * @returns {Node} A new node with the given port.
 * @throws {Error} If the node already has a port with that name.
 */
export const addInputPort = curry((port, node) => {
  port = getPort(port, node)
  return addPort(port, 'input', node)
})

/**
 * @function
 * @name addOutputPort
 * @description Adds a new output port to the node.
 * @params {Port|String} port The port to add.
 * @params {Node} node The node that gets the port.
 * @returns {Node} A new node with the given port.
 * @throws {Error} If the node already has a port with that name.
 */
export const addOutputPort = curry((port, node) => {
  port = getPort(port, node)
  return addPort(port, 'output', node)
})
