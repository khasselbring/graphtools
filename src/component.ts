/**
 * A component is a template for nodes. They represent the structure of the component.
 *
 * A component consists of a `componentId` and is an atomic or a compound node. It must have
 * a valid semver version and a list of ports (each component must have at least one port).
 *
 * ```json
 * {
 *   componentId: 'componentIdentifier',
 *   version: "1.0.0",
 *   atomic: true,
 *   ports: [{port: 'in', kind: 'input', type: 'Number'},{port: 'out', kind: 'output', type: 'Number'}]
 * }
 * ```
 *
 * Accessible via `require('@buggyorg/graphtools').Component`
 * @module Component */

import {curry, omit, zip, fromPairs, merge} from 'lodash/fp'
import * as _ from 'lodash'
import * as Port from './port'
import {Edge} from './edge'
import {children, isCompound, Compound} from './compound'
import {create, id as nodeID} from './node'
import * as semver from 'semver'
import isEqual from 'lodash/fp/isEqual'

const OUTPUT = 'output'
const INPUT = 'input'

interface Component extends Compound {
  componentId: string
}

/**
 * Returns the unique identifier of a node
 * @param {Component|string} node The node
 * @returns {string} The unique identifier of the node
 * @throws {Error} If the node value is invalid.
 */
export function id (component:Component|string) {
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
 * @description Tests whether two components are the same component. This tests only if their component IDs are
 * the same not if both components contain the same information.
 * @param {Component} comp1 One of the components to test.
 * @param {Component} comp2 The other one.
 * @returns {boolean} True if they have the same id, false otherwise.
 */
export function equal (comp1:Component, comp2:Component) {
  return id(comp1) === id(comp2)
}

/**
 * Gets all ports of the component.
 * @param {Component} comp The component.
 * @returns {Port[]} A list of ports.
 */
export function ports (comp:Component) {
  return comp.ports || []
}

/**
 * Gets all output ports of the comp.
 * @param {Component} comp The node.
 * @returns {Port[]} A possibly empty list of output ports.
 */
export function outputPorts (comp:Component, ignoreCompounds = false) {
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
export function inputPorts (comp:Component, ignoreCompounds = false) {
  if (!ignoreCompounds && !comp.atomic) {
    return comp.ports
  } else {
    return comp.ports.filter((p) => p.kind === INPUT)
  }
}

/**
 * @description Returns the port data for a given port.
 * @param {String} name The name of the port.
 * @param {Component} comp The component which has the port.
 * @returns {Port} The port data.
 * @throws {Error} If no port with the given name exists in this component an error is thrown.
 */
export function port (name:string, comp:Component) {
  var port = _.find(comp.ports, (p) => Port.portName(p) === name)
  if (!port) {
    throw new Error('Cannot find port with name ' + name + ' in component ' + JSON.stringify(comp))
  }
  return port
}

/**
 * @description Checks whether the component has the specific port.
 * @param {String} name The name of the port.
 * @param {Component} comp The component which has the port.
 * @returns {Port} True if the port has a port with the given name, false otherwise.
 */
export function hasPort (name:string, comp:Component) {
  return !!_.find(comp.ports, (p) => Port.portName(p) === name)
}

/**
 * Checks whether a component is in a valid format, i.e. if it has an id field and at least one port.
 * @param {Component} comp The component to test.
 * @returns {boolean} True if the component is valid, false otherwise.
 */
export function isValid (comp) {
  return typeof (comp) === 'object' && typeof (comp.componentId) === 'string' && comp.componentId.length > 0 &&
    ports(comp).length !== 0 && typeof (comp.version) === 'string' && semver.valid(comp.version)
}

export function assertValid (comp) {
  if (typeof (comp) !== 'object') {
    throw new Error('Component is not an object, but it is: ' + comp)
  }
  if (typeof (comp.componentId) !== 'string' || comp.componentId.length === 0) {
    throw new Error('Component must have a valid id (string with at least one character), but it is: ' + comp.componentId)
  }
  if (ports(comp).length === 0) {
    throw new Error('Component "' + id(comp) + '" must have at least one port.')
  }
  if (typeof (comp.version) !== 'string' || !semver.valid(comp.version)) {
    throw new Error('Component "' + id(comp) + '" must have a valid version, but it is: ' + comp.version)
  }
}

function mapEdgeIDs (map, edge:Edge) {
  return <Edge>merge(edge, {
    from: {
      node: (map[edge.from.node]) ? map[edge.from.node] : edge.from.node
    },
    to: {
      node: (map[edge.to.node]) ? map[edge.to.node] : edge.to.node
    }
  })
}

/**
 * Create a node from a component.
 * @param {Reference} reference The reference to the component.
 * @param {Component} comp The component that is the basis for the new node.
 * @returns {Node} A node with the given name representing the component.
 */
export function createNode (reference, comp:Component) {
  if (isCompound(comp)) {
    const newNodes = children(comp).map(omit('id')).map(create)
    const idMapping = fromPairs(zip(children(comp).map(nodeID), newNodes.map(nodeID)))
    return <Compound>_.merge({}, reference, comp, {
      nodes: newNodes,
      edges: (comp.edges || []).map((e) => mapEdgeIDs(idMapping, e))
    })
  }
  return <Node>_.merge({}, reference, comp)
}

/**
 * Tests if two components are isomorphic i.e. deep equal.
 * @param {Component} graph1 One of the graphs.
 * @param {Component} graph2 And the other graph to test.
 * @returns {boolean} True if the components of the two graphs are isomorphic, false otherwise. Components
 * are isomorphic, if they are deep equal.
 */
export function isomorph (graph1:Component, graph2:Component):boolean {
  return isEqual(graph1, graph2)
}
