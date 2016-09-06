/** @module Node */

import _ from 'lodash'
import * as Path from './path'
import cuid from 'cuid'

/**
 * A node either as an identifier, or as an object containing the property `node` as its identifier.
 * @typedef {(string|Object)} Node
 */

const OUTPUT = 'output'
const INPUT = 'input'

/**
 * Creates a normalized node object. It makes sure, that the node has all necessary information like an id and a
 * normalized path.
 * @param {Node} node A protypical node object.
 * @returns {Node} A complete node object
 */
export function create (node) {
  return _.merge({id: cuid()}, node,
    {path: (node.path) ? Path.normalize(node.path) : undefined})
}

/**
 * Returns the unique identifier of a node
 * @params {Node} node The node
 * @returns {string} The unique identifier of the node
 * @throws {Error} If the node value is invalid.
 */
export function id (node) {
  if (typeof (node) === 'string') {
    return node
  } else if (node == null) {
    throw new Error('Cannot determine id of undefined node.')
  } else if (!node.id) {
    throw new Error('Malformed node. The node must either be a string that represents the id. Or it must be an object with an id field.\n Node: ' + JSON.stringify(node))
  }
  return node.id
}

/**
 * Tests whether two nodes are the same node. This tests only if their IDs are
 * the same not if both nodes contain the same information.
 * @param {Node} node1 One of the nodes to test.
 * @param {Node} node2 The other one.
 * @returns {boolean} True if they have the same id, false otherwise.
 */
export function equal (node1, node2) {
  return id(node1) === id(node2)
}

/**
 * Gets all ports of the node.
 * @param {Node} node The node.
 * @returns {Port[]} A list of ports.
 */
export function ports (node) {
  return node.ports || []
}

/**
 * Gets all output ports of the node.
 * @param {Node} node The node.
 * @returns {Port[]} A possibly empty list of output ports.
 */
export function outputPorts (node, ignoreCompounds = false) {
  if (!ignoreCompounds && !node.atomic) {
    return node.ports
  } else {
    return node.ports.filter((p) => p.kind === OUTPUT)
  }
}

/**
 * Gets all input ports of the node.
 * @param {Node} node The node.
 * @returns {Port[]} A possibly empty list of input ports.
 */
export function inputPorts (node, ignoreCompounds = false) {
  if (!ignoreCompounds && !node.atomic) {
    return node.ports
  } else {
    return node.ports.filter((p) => p.kind === INPUT)
  }
}

/**
 * Returns the port data for a given port.
 * @param {Node} node The node which has the port.
 * @param {String} name The name of the port.
 * @returns {Port} The port data.
 * @throws {Error} If no port with the given name exists in this node an error is thrown.
 */
export function port (node, name) {
  var port = _.find(node.ports, (p) => p.name === name)
  if (!port) {
    throw new Error('Cannot find port with name ' + name + ' in node ' + JSON.stringify(node))
  }
  return port
}

export function path (node) {
  return node.path
}

/**
 * Checks whether the node has the specific port.
 * @param {Node} node The node which has the port.
 * @param {String} name The name of the port.
 * @returns {Port} True if the port has a port with the given name, false otherwise.
 */
export function hasPort (node, name) {
  return !!_.find(node.ports, (p) => p.name === name)
}

/**
 * Checks whether the node is a reference.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is a reference, false otherwise.
 */
export function isReference (node) {
  return _.has(node, 'ref') && node.id
}

/**
 * Checks whether a node is an atomic node.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is an atomic node, false otherwise.
 */
export function isAtomic (node) {
  return !isReference(node) && node.atomic
}

function validPort (port) {
  return typeof (port) === 'object' && port.name && (port.kind === INPUT || port.kind === OUTPUT) && port.type
}

/**
 * Checks whether a node is in a valid format, i.e. if it has an id field and at least one port.
 * @param {Node} node The node to test.
 * @returns {boolean} True if the node is valid, false otherwise.
 */
export function isValid (node) {
  return isReference(node) ||
    (typeof (node) === 'object' && typeof (node.id) === 'string' && node.id.length > 0 &&
    ports(node).length !== 0 && _.every(ports(node), validPort))
}
