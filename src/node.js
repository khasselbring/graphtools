/** @module node */

import _ from 'lodash'

/**
 * A node either as an identifier, or as an object containing the property `node` as its identifier.
 * @typedef {(string|Object)} Node
 */

const OUTPUT = 'output'
const INPUT = 'input'

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
    return node.ports.filter((p) => p.type === OUTPUT)
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
    return node.ports.filter((p) => p.type === INPUT)
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
 * Checks whether a node is in a valid format, i.e. if it has an id field and at least one port.
 * @param {Node} node The node to test.
 * @returns {boolean} True if the node is valid, false otherwise.
 */
export function isValid (node) {
  return typeof (node) === 'object' && typeof (node.id) === 'string' && node.id.length > 0 &&
    ports(node).length !== 0
}
