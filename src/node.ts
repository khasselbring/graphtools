/**
 * Accessible via `require('@buggyorg/graphtools').Node`
 * @module Node */

import {every, zip, has, find, merge, curry} from 'lodash/fp'
import * as Port from './port'
import cuid = require('cuid')
import {node as pathNode, isCompoundPath, equal as pathEqual, parent, CompoundPath} from './compoundPath'

const newID = (process.env.NODE_IDS) ? (() => { var cnt = 0; return () => 'node_' + cnt++ })() : cuid

export interface ReferenceNode {
  ref: string
  id?: string
  name?: string
  ports?: [Port.Port]
  metaInformation?: any
  settings?: any
  path?: CompoundPath
}

export interface ConcreteNode {
  id?: string
  name?: string,
  componentId?: string
  path?: CompoundPath
  atomic?: boolean
  ports: [Port.Port]
  metaInformation?: any
  settings?: any
}

export type Node = ReferenceNode | ConcreteNode

/**
 * Creates a normalized node object. It makes sure, that the node has all necessary information like an id
 * and normalized ports.
 * @param {Node} node A protypical node object.
 * @returns {Node} A complete node object
 */
export function create (node:Node) {
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
export function isID (str:string) {
  return typeof (str) === 'string' && (str[0] === '#')
}

/**
 * Returns the unique identifier of a node. The id is unique for the whole graph and cannot be assigned twice.
 * @param {Node|string} node The node
 * @returns {string} The unique identifier of the node
 * @throws {Error} If the node value is invalid.
 */
export function id (node:Node|string) {
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
 * @params {Node|string} node The node
 * @returns {string} The name of the node.
 */
export function name (node:Node|string|CompoundPath) {
  if (typeof (node) === 'string') {
    return node
  } else if ((<any>node).name) {
    return (<Node>node).name
  } else if (isCompoundPath(<any>node)) {
    return pathNode(<CompoundPath>node)[0]
  } else {
    return (<Node>node).id
  }
}

/**
 * Checks the node for a name
 * @param {Node} node The node
 * @returns {boolean} True if it has a name, false otherwise.
 */
export function hasName (node:Node) {
  return !!node.name
}

/**
 * Checks the node for a path
 * @param {Node} node The node
 * @returns {boolean} True if it has a path, false otherwise.
 */
export function hasPath (node:Node) {
  return !!node.path
}

/**
 * Checks the node for an id
 * @param {Node} node The node
 * @returns {boolean} True if it has an id, false otherwise.
 */
export function hasID (node:Node) {
  return !!node.id
}

type Nodeish = Node | string | Port.Port

/**
 * @description Tests whether two nodes are the same node. This tests only if their IDs are
 * the same not if both nodes contain the same information.
 * @param {Node} node1 One of the nodes to test.
 * @param {Node} node2 The other one.
 * @returns {boolean} True if they have the same id, false otherwise.
 */
export function equal (node1:Nodeish, node2:Nodeish) {
  if (((isValid(<any>node1) && (hasID(<Node>node1) || !isReference(<Node>node1))) || isID(<string>node1)) &&
      ((isValid(<any>node2) && (hasID(<Node>node2) || !isReference(<Node>node2))) || isID(<string>node2))) {
    return id(<Node>node1) && id(<Node>node2) && id(<Node>node1) === id(<Node>node2)
  } else if (Port.isPort(node1)) {
    return equal(Port.node(<Port.Port>node1), node2)
  } else if (Port.isPort(node2)) {
    return equal(node1, Port.node(<Port.Port>node2))
  } else if (hasPath(<Node>node1) && hasPath(<Node>node2)) {
    return pathEqual(parent((<Node>node1).path), parent((<Node>node2).path))
        && name(<Node>node1) === name(<Node>node2)
  } else {
    return name(<string>node1) === name(<string>node2)
  }
}

export function isomorph (node1:Node, node2:Node) {
  if (!zip(ports(node1), ports(node2)).every(([p1, p2]) => Port.isomorph(p1, p2))) {
    return false
  }
  if (isAtomic(node1)) {
    return isAtomic(node2) && component(node1) === component(node2)
  } else {
    return !isAtomic(node2)
  }
}

/**
 * Gets all ports of the node.
 * @param {Node} node The node.
 * @returns {Port[]} A list of ports.
 */
export function ports (node:Node) {
  return (node.ports) ? node.ports.map((n) => merge(n, {node: node.id})) : []
}

export function setPort (node:Node, port, update) {
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
export function outputPorts (node:Node, ignoreCompounds = true) {
  if (!ignoreCompounds && !(<any>node).atomic) {
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
export function inputPorts (node:Node, ignoreCompounds = true) {
  if (!ignoreCompounds && !(<any>node).atomic) {
    return ports(node)
  } else {
    return ports(node).filter(Port.isInputPort)
  }
}

/**
 * @description Returns the port data for a given node and port.
 * @param {string|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} The port data.
 * @throws {Error} If no port with the given name exists in this node an error is thrown.
 */
export function port (name:string|Port.Port, node:Node) {
  if (Port.isPort(name)) {
    return port(Port.portName(<Port.Port>name), node)
  }
  var curPort = find((p) => Port.portName(p) === name, node.ports)
  if (!curPort) {
    throw new Error('Cannot find port with name ' + name + ' in node ' + JSON.stringify(node))
  }
  curPort.node = node.id
  return curPort
}

/**
 * @description Returns the input port data for a given node and port name / index.
 * @param {String|Port|Number} name The name of the input port, a port object or the index.
 * @param {Node} node The node which has the port.
 * @returns {Port} The input port data.
 * @throws {Error} If no port with the given name exists in this node an error is thrown.
 */
export function inputPort (name, node:Node) {
  if (Port.isPort(name)) {
    return inputPort(Port.portName(name), node)
  }
  if (typeof (name) === 'number') return inputPorts(node)[name]
  var curPort = find((p) => Port.portName(p) === name, inputPorts(node))
  if (!curPort) {
    throw new Error('Cannot find port with name ' + name + ' in node ' + JSON.stringify(node))
  }
  return curPort
}

/**
 * @function
 * @name outputPort
 * @description Returns the output port data for a given node and port name / index.
 * @param {String|Port|Number} name The name of the output port, a port object or the index.
 * @param {Node} node The node which has the port.
 * @returns {Port} The output port data.
 * @throws {Error} If no port with the given name exists in this node an error is thrown.
 */
export function outputPort (name, node:Node) {
  if (Port.isPort(name)) {
    return outputPort(Port.portName(name), node)
  }
  if (typeof (name) === 'number') return outputPorts(node)[name]
  var curPort = find((p) => Port.portName(p) === name, outputPorts(node))
  if (!curPort) {
    throw new Error('Cannot find port with name ' + name + ' in node ' + JSON.stringify(node))
  }
  return curPort
}

/**
 * Gets the path of a node
 * @param {Node} node The node
 * @returns {CompoundPath} The compound path of the node.
 */
export function path (node:Node):CompoundPath {
  if (!node) return <CompoundPath>[]
  return node.path
}

/**
 * @description Checks whether the node has the specific port.
 * @param {String|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} True if the port has a port with the given name, false otherwise.
 */
export function hasPort (name, node:Node) {
  if (Port.isPort(name)) {
    return hasPort(Port.portName(name), node)
  }
  return !!find((p) => Port.portName(p) === name, node.ports)
}

/**
 * @description Checks whether the node has the specific input port.
 * @param {String|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} True if the port has an input port with the given name, false otherwise.
 */
export function hasInputPort (name, node:Node) {
  if (Port.isPort(name)) {
    return hasInputPort(Port.portName(name), node)
  }
  return !!find((p) => Port.portName(p) === name, inputPorts(node))
}

/**
 * @description Checks whether the node has the specific output port.
 * @param {String|Port} name The name of the port or a port object.
 * @param {Node} node The node which has the port.
 * @returns {Port} True if the port has an output port with the given name, false otherwise.
 */
export function hasOutputPort (name, node:Node) {
  if (Port.isPort(name)) {
    return hasOutputPort(Port.portName(name), node)
  }
  return !!find((p) => Port.portName(p) === name, outputPorts(node))
}


/**
 * Checks whether the node is a reference.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is a reference, false otherwise.
 */
export function isReference (node:Node) {
  return has('ref', node)
}

/**
 * Returns the componentId of the node.
 * @param {Node} node The node.
 * @returns {string} The componentId of the node.
 */
export function component (node:Node) {
  return isReference(node) ? (<ReferenceNode>node).ref : (<ConcreteNode>node).componentId
}

/**
 * @description Set properties for the node
 * @param {object} value An object with keys and values that should be set for a node.
 * @returns {Node} A new node that has the new properties applied.
 */
export function set (value, node:Node):Node {
  return merge(node, {settings: merge(node.settings, value)})
}

/**
 * @description Get a property for a node
 * @param {String} key The property key.
 * @returns The value of the property. If the property is not defined it will return undefined.
 */
export function get (key, node:Node) {
  return (node.settings) ? node.settings[key] : node.settings
}

/**
 * Checks whether a node is an atomic node.
 * @param {Node} node The node.
 * @returns {boolean} True if the node is an atomic node, false otherwise.
 */
export function isAtomic (node:Node) {
  return !isReference(node) && (<any>node).atomic
}

/**
 * Checks whether a node is in a valid format, i.e. if it has an id field and at least one port.
 * @param {Node} node The node to test.
 * @returns {boolean} True if the node is valid, false otherwise.
 */
export function isValid (node:any):boolean {
  return isReference(<Node>node) ||
    (typeof (node) === 'object' && typeof (node.id) === 'string' && node.id.length > 0 &&
    every(Port.isValid, ports(node)))
}

export function assertValid (node:Node) {
  if (typeof (node) !== 'object') {
    throw new Error('Node object must be an object but got: ' + typeof (node))
  } else if (!node.id) {
    throw new Error('Node must have a valid ID in :(' + JSON.stringify(node) + ')')
  } else if (!node.id.length) {
    throw new Error('Node must have an ID with non zero length.')
  }
  ports(node).forEach(Port.assertValid)
}
