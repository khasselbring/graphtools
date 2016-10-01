/** @module Component */

import curry from 'lodash/fp/curry'
import _ from 'lodash'
import * as Port from './port'
import {children, isCompound} from './compound'
import {create} from './node'
import semver from 'semver'

const OUTPUT = 'output'
const INPUT = 'input'

/**
 * Returns the unique identifier of a node
 * @params {Component} node The node
 * @returns {string} The unique identifier of the node
 * @throws {Error} If the node value is invalid.
 */
export function id (component) {
  if (typeof (component) === 'string') {
    return component
  } else if (component == null) {
    throw new Error('Cannot determine id of undefined component.')
  } else if (!component.componentId) {
    throw new Error('Malformed component. The component must either be a string that represents the id. Or it must be an object with an componendId field.\n Component: ' + JSON.stringify(component))
  }
  return component.componentId
}

/**
 * @function
 * @name equal
 * @description Tests whether two components are the same component. This tests only if their component IDs are
 * the same not if both components contain the same information.
 * @param {Component} comp1 One of the components to test.
 * @param {Component} comp2 The other one.
 * @returns {boolean} True if they have the same id, false otherwise.
 */
export const equal = curry((comp1, comp2) => {
  return id(comp1) === id(comp2)
})

/**
 * Gets all ports of the component.
 * @param {Component} comp The component.
 * @returns {Port[]} A list of ports.
 */
export function ports (comp) {
  return comp.ports || []
}

/**
 * Gets all output ports of the comp.
 * @param {Component} comp The node.
 * @returns {Port[]} A possibly empty list of output ports.
 */
export function outputPorts (comp, ignoreCompounds = false) {
  if (!ignoreCompounds && !comp.atomic) {
    return comp.ports
  } else {
    return comp.ports.filter((p) => p.kind === OUTPUT)
  }
}

/**
 * Gets all input ports of the component.
 * @param {Component} comp The component.
 * @returns {Port[]} A possibly empty list of input ports.
 */
export function inputPorts (comp, ignoreCompounds = false) {
  if (!ignoreCompounds && !comp.atomic) {
    return comp.ports
  } else {
    return comp.ports.filter((p) => p.kind === INPUT)
  }
}

/**
 * @function
 * @name port
 * @description Returns the port data for a given port.
 * @param {Component} comp The component which has the port.
 * @param {String} name The name of the port.
 * @returns {Port} The port data.
 * @throws {Error} If no port with the given name exists in this component an error is thrown.
 */
export const port = curry((name, comp) => {
  var port = _.find(comp.ports, (p) => Port.portName(p) === name)
  if (!port) {
    throw new Error('Cannot find port with name ' + name + ' in component ' + JSON.stringify(comp))
  }
  return port
})

/**
 * @function
 * @name hasPort
 * @description Checks whether the component has the specific port.
 * @param {String} name The name of the port.
 * @param {Component} comp The component which has the port.
 * @returns {Port} True if the port has a port with the given name, false otherwise.
 */
export const hasPort = curry((name, comp) => {
  return !!_.find(comp.ports, (p) => Port.portName(p) === name)
})

/**
 * Checks whether a component is in a valid format, i.e. if it has an id field and at least one port.
 * @param {Component} comp The component to test.
 * @returns {boolean} True if the component is valid, false otherwise.
 */
export function isValid (comp) {
  return typeof (comp) === 'object' && typeof (comp.componentId) === 'string' && comp.componentId.length > 0 &&
    ports(comp).length !== 0 && typeof (comp.version) === 'string' && semver.valid(comp.version)
}

/**
 * Create a node from a component.
 * @param {Reference} reference The reference to the component.
 * @param {Component} comp The component that is the basis for the new node.
 * @returns {Node} A node with the given name representing the component.
 */
export function createNode (reference, comp) {
  if (isCompound(comp)) {
    return _.merge({}, reference, comp, {nodes: children(comp).map(create)})
  }
  return _.merge({}, reference, comp)
}
