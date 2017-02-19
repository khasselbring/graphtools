/**
 * Accessible via `require('@buggyorg/graphtools').Node`
 * @module Node */

import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import find from 'lodash/fp/find'
import has from 'lodash/fp/has'
import every from 'lodash/fp/every'
import zip from 'lodash/fp/zip'
import * as Port from './port'
import cuid from 'cuid'
import {node as pathNode, isCompoundPath, equal as pathEqual, parent} from './compoundPath'

const newID = (process.env.NODE_IDS) ? (() => { var cnt = 0; return () => 'node_' + cnt++ })() : cuid

/**
 * Creates a normalized node object. It makes sure, that the node has all necessary information like an id
 * and normalized ports.
 * @param {Node} node A protypical node object.
 * @returns {Node} A complete node object
 */
export function create (node) {
  if (node.id) {
    throw new Error('You cannot explicitly assign an id for a node. Use the name field for node addressing')
  }
  var newNode = merge(node, {id: '#' + newID(), settings: merge({}, node.settings), ports: (node.ports) ? node.ports.map(Port.normalize) : []})
  if (!isReference(newNode) && !isValid(newNode)) {
    throw new Error('Cannot create invalid node: ' + JSON.stringify(node))
  }
  return newNode
}

/**
 * Checks if the given object is an id.
 * @param obj The object to test
 * @returns {boolean} True if the object is an id, false otherwise.
 */
export function isID (str) {
  return typeof (str) === 'string' && (str[0] === '#')
}

/**
 * Returns the unique identifier of a node. The id is unique for the whole graph and cannot be assigned twice.
 * @params {Node} node The node
 * @returns {string} The unique identifier of the node
 * @throws {Error} If the node value is invalid.
 */
export function id (node) {
  if (typeof (node) === 'string') {
    return node
  } else if (node == null) {
    throw new Error('Cannot determine id of undefined node.')
  }
  return node.id
}

/**
 * Gets the name of a node. The name is a unique identifier in respect to the parent. Each graph
 * can have only one node with a specific name as its direct child. If a node has no name, the
 * id is the name of the node.
 * @params {Node} node The node
 * @returns {string} The name of the node.
 */
export function name (node) {
  if (typeof (node) === 'string') {
    return node
  } else if (node.name) {
    return node.name
  } else if (isCompoundPath(node)) {
    return pathNode(node)[0]
  } else {
    return node.id
  }
}

/**
 * Checks the node for a name
 * @param {Node} node The node
 * @returns {boolean} True if it has a name, false otherwise.
 */
export function hasName (node) {
  return !!node.name
}

/**
 * Checks the node for a path
 * @param {Node} node The node
 * @returns {boolean} True if it has a path, false otherwise.
 */
export function hasPath (node) {
  return !!node.path
}

/**
 * Checks the node for an id
 * @param {Node} node The node
 * @returns {boolean} True if it has an id, false otherwise.
 */
export function hasID (node) {
  return !!node.id
}

/**
 * Checks the node for children
 * @param {Node} node The node
 * @returns {boolean} True if it has children, false otherwise.
 */
export function hasChildren (node) {
  return !get('hideChildren', node) && Array.isArray(node.nodes)
}

/**
 * @function
 * @name equal
 * @description Tests whether two nodes are the same node. This tests only if their IDs are
 * the same not if both nodes contain the same information.
 * @param {Node} node1 One of the nodes to test.
 * @param {Node} node2 The other one.
 * @returns {boolean} True if they have the same id, false otherwise.
 */
export const equal = curry((node1, node2) => {
  if (((isValid(node1) && (hasID(node1) || !isReference(node1))) || isID(node1)) &&
      ((isValid(node2) && (hasID(node2) || !isReference(node2))) || isID(node2))) {
    return id(node1) && id(node2) && id(node1) === id(node2)
  } else if (Port.isPort(node1)) {
    return equal(Port.node(node1), node2)
  } else if (Port.isPort(node2)) {
    return equal(node1, Port.node(node2))
  } else if (hasPath(node1) && hasPath(node2)) {
    return pathEqual(parent(node1), parent(node2)) && name(node1) === name(node2)
  } else {
    return name(node1) === name(node2)
  }
})

export const isomorph = curry((node1, node2) => {
  if (!zip(ports(node1), ports(node2)).every(([p1, p2]) => Port.isomorph(p1, p2))) {
    return false
  }
  if (isAtomic(node1)) {
    return isAtomic(node2) && component(node1) === component(node2)
  } else {
    return !isAtomic(node2)
  }
})

/**
 * Gets all ports of the node.
 * @param {Node} node The node.
 * @returns {Port[]} A list of ports.
 */
export function ports (node) {
  return (node.ports) ? node.ports.map(merge({node: node.id})) : []
}

export function setPort (node, port, update) {
  return merge(node, {ports: node.ports.map((p, id) => {
    if (typeof (port) === 'number' && id === port) {
      return merge(p, update)
    } else if (typeof (port) === 'string' && Port.portName(p) === port) {
      return merge(p, update)
    } return p
  })})
}

/**
 * Gets all output ports of the node.
 * @param {Node} node The node.
 * @returns {Port[]} A possibly empty list of output ports.
 */
export function outputPorts (node, ignoreCompounds = true) {
  if (!ignoreCompounds && !node.atomic) {
    return ports(node)
  } else {
    return ports(node).filter(Port.isOutputPort)
  }
}

/**
 * Gets all input ports of the node.
 * @param {Node} node The node.
 * @returns {Port[]} A possibly empty list of input ports.
 */
export function inputPorts (node, ignoreCompounds = true) {
  if (!ignoreCompounds && !node.atomic) {
    return ports(node)
  } else {
    return ports(node).filter(Port.isInputPort)
  }
}

/**
 * @function
 * @name port
 * @description Returns the port data for a given node and port.
 * @param {String|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} The port data.
 * @throws {Error} If no port with the given name exists in this node an error is thrown.
 */
export const port = curry((name, node) => {
  if (Port.isPort(name)) {
    return port(Port.portName(name), node)
  }
  var curPort = find((p) => Port.portName(p) === name, node.ports)
  if (!curPort) {
    throw new Error('Cannot find port with name ' + name + ' in node ' + JSON.stringify(node))
  }
  return curPort
})

/**
 * @function
 * @name inputPort
 * @description Returns the input port data for a given node and port name / index.
 * @param {String|Port|Number} name The name of the input port, a port object or the index.
 * @param {Node} node The node which has the port.
 * @returns {Port} The input port data.
 * @throws {Error} If no port with the given name exists in this node an error is thrown.
 */
export const inputPort = curry((name, node) => {
  if (Port.isPort(name)) {
    return inputPort(Port.portName(name), node)
  }
  if (typeof (name) === 'number') return inputPorts(node)[name]
  var curPort = find((p) => Port.portName(p) === name, inputPorts(node))
  if (!curPort) {
    throw new Error('Cannot find port with name ' + name + ' in node ' + JSON.stringify(node))
  }
  return curPort
})

/**
 * @function
 * @name outputPort
 * @description Returns the output port data for a given node and port name / index.
 * @param {String|Port|Number} name The name of the output port, a port object or the index.
 * @param {Node} node The node which has the port.
 * @returns {Port} The output port data.
 * @throws {Error} If no port with the given name exists in this node an error is thrown.
 */
export const outputPort = curry((name, node) => {
  if (Port.isPort(name)) {
    return outputPort(Port.portName(name), node)
  }
  if (typeof (name) === 'number') return outputPorts(node)[name]
  var curPort = find((p) => Port.portName(p) === name, outputPorts(node))
  if (!curPort) {
    throw new Error('Cannot find port with name ' + name + ' in node ' + JSON.stringify(node))
  }
  return curPort
})

/**
 * Gets the path of a node
 * @param {Node} node The node
 * @returns {CompoundPath} The compound path of the node.
 */
export function path (node) {
  if (!node) return []
  return node.path
}

/**
 * @function
 * @name hasPort
 * @description Checks whether the node has the specific port.
 * @param {String|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} True if the port has a port with the given name, false otherwise.
 */
export const hasPort = curry((name, node) => {
  if (Port.isPort(name)) {
    return hasPort(Port.portName(name), node)
  }
  return !!find((p) => Port.portName(p) === name, node.ports)
})

/**
 * @function
 * @name hasPort
 * @description Checks whether the node has the specific input port.
 * @param {String|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} True if the port has an input port with the given name, false otherwise.
 */
export const hasInputPort = curry((name, node) => {
  if (Port.isPort(name)) {
    return hasInputPort(Port.portName(name), node)
  }
  return !!find((p) => Port.portName(p) === name, inputPorts(node))
})

/**
 * @function
 * @name hasPort
 * @description Checks whether the node has the specific output port.
 * @param {String|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} True if the port has an output port with the given name, false otherwise.
 */
export const hasOutputPort = curry((name, node) => {
  if (Port.isPort(name)) {
    return hasOutputPort(Port.portName(name), node)
  }
  return !!find((p) => Port.portName(p) === name, outputPorts(node))
})


/**
 * Checks whether the node is a reference.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is a reference, false otherwise.
 */
export function isReference (node) {
  return has('ref', node)
}

/**
 * Returns the componentId of the node.
 * @param {Node} node The node.
 * @returns {string} The componentId of the node.
 */
export function component (node) {
  return isReference(node) ? node.ref : node.componentId
}

/**
 * @function
 * @name set
 * @description Set properties for the node
 * @param {object} value An object with keys and values that should be set for a node.
 * @returns {Node} A new node that has the new properties applied.
 */
export const set = curry((value, node) => {
  return merge(node, {settings: merge(node.settings, value)})
})

/**
 * @function
 * @name get
 * @description Get a property for a node
 * @param {String} key The property key.
 * @returns The value of the property. If the property is not defined it will return undefined.
 */
export const get = curry((key, node) => (node.settings) ? node.settings[key] : node.settings)

/**
 * Checks whether a node is an atomic node.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is an atomic node, false otherwise.
 */
export function isAtomic (node) {
  return !isReference(node) && node.atomic
}

/**
 * Checks whether a node is in a valid format, i.e. if it has an id field and at least one port.
 * @param {Node} node The node to test.
 * @returns {boolean} True if the node is valid, false otherwise.
 */
export function isValid (node) {
  return isReference(node) ||
    (typeof (node) === 'object' && typeof (node.id) === 'string' && node.id.length > 0 &&
    every(Port.isValid, ports(node)))
}

export function assertValid (node) {
  if (typeof (node) !== 'object') {
    throw new Error('Node object must be an object but got: ' + typeof (node))
  } else if (!node.id) {
    throw new Error('Node must have a valid ID in :(' + JSON.stringify(node) + ')')
  } else if (!node.id.length) {
    throw new Error('Node must have an ID with non zero length.')
  }
  ports(node).forEach(Port.assertValid)
}
