/** @module Port
 * Methods for handling ports. A port is attached to a node and connects data sources with sinks.
 * The port format is a unique identifier for the port and its node unlike the port name.
 */

import _ from 'lodash'

const OUTPUT = 'output'
const INPUT = 'input'

/**
 * Checks whether a string represents a port notation. A port notation is a string that
 * contains the information about the node and the port separated by an `@`, e.g. 'nodeA@portB'
 * @params {string} port The string to check
 * @returns {boolean} True if the string represents a port notation, false otherwise.
 */
export function isPortNotation (port) {
  return typeof (port) === 'string' && port.indexOf('@') !== -1
}

function parsePortNotation (port) {
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

/**
 * Returns a normalized port object in the form `{node: <node-id>, port: <port-name>}`
 * @param port The port object in any digestable form.
 * @returns {Port} A port object.
 */
export function normalize (port) {
  if (isPortNotation(port)) {
    return assureType(parsePortNotation(port))
  } else {
    return assureType(port)
  }
}

function assureType (port) {
  if (!port.type) {
    return _.merge({type: 'generic'}, port)
  }
  return port
}

/**
 * returns the node stored in the port
 * @param {Port} port The port in any form.
 * @returns {NodeID} The node of the port.
 */
export function node (port) {
  return normalize(port).node
}

/**
 * returns the port name stored for the port.
 * @param {Port} port The port in any form.
 * @returns {string} The name of the port.
 */
export function portName (port) {
  return normalize(port).port
}

/**
 * returns whether the given port is an output port or not
 * @param {Port} port The port to check
 * @returns {boolean} True if the port is an output port, false otherwise.
 */
export function isOutputPort (port) {
  return port.kind === OUTPUT
}

/**
 * returns whether the given port is an input port or not
 * @param {Port} port The port to check
 * @returns {boolean} True if the port is an input port, false otherwise.
 */
export function isInputPort (port) {
  return port.kind === INPUT
}

/**
 * Returns whether the given object is a port object or not.
 * @params any Any value.
 * @returns {boolean} True if the value is a port, false otherwise.
 */
export function isPort (any) {
  return (typeof (any) === 'object' && typeof (any.node) === 'string' && typeof (any.port) === 'string') ||
    typeof (any) === 'string' && isPortNotation(any)
}

export function isValid (port) {
  return typeof (port) === 'object' && port.port && (port.kind === INPUT || port.kind === OUTPUT) && port.type
}

/**
 * Returns a string representation of the port
 * @params {Port} port The port
 * @returns {string} A string representation of the port.
 */
export function toString (port) {
  return node(port) + '@' + portName(port)
}

export function equal (port1, port2) {
  return node(port1) === node(port2) && portName(port1) === portName(port2)
}

export function create (node, port, kind) {
  if (typeof (node) === 'object') {
    return normalize({node: node.id, port, kind})
  } else {
    return normalize({node, port, kind})
  }
}
