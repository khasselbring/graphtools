/**
 * A location is an object that defines a port or a node in the graph.
 */

import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import {nodeByPath, nodesDeep} from './graph/internal'
import {isPort} from './port'
import {isValid as isNode} from './node'

/** A port notation can have every of the other notations for the node and as such
 * it is necessary to check first if it is a port notation. The symbol '@' is only used in
 * port notations.
 */
function isPortNotation (str) {
  return str.indexOf('@') !== -1
}

function isCompoundPathNotation (str) {
  return !isPortNotation(str) && str[0] === '»'
}

function isComponent (str) {
  return !isPortNotation(str) && str[0] === '/'
}

function isIndex (str) {
  return !isPortNotation(str) && str[0] === '#'
}

function isRoot (str) {
  return str === ''
}

/*
function isName (str) {
  return !isPortNotation(str) && !isIndex(str) && !isCompoundPathNotation(str)
}
*/

function parsePortNotation (port) {
  var split = port.split('@')
  if (split[1] === '') {
    throw new Error('Invalid port notation. Port notation does not contain a port. Parsed port: ' + port)
  }
  return merge(fromString(split[0], false), {type: 'location', locType: 'port', port: split[1]})
}

/**
 * Converts a compound path string into its array representation. The seperate parts must be divided by a '»'.
 * @param {String} compoundPathStr A string reperesenting the compound path divded by '»'.
 * @returns {String[]} An array of node IDs representing the compound path.
 */
export function parseCompoundPath (compoundPathStr) {
  if (compoundPathStr.indexOf('»') === -1) return [compoundPathStr]
  return compoundPathStr.split('»').slice(1)
}

/** Creates a location object from the string representation */
function fromString (str, allowsPorts = true) {
  if (isPortNotation(str)) {
    if (!allowsPorts) {
      throw new Error('Found unexpected port notation. Do you have multiple @\'s in your location string?')
    }
    return parsePortNotation(str)
  } else if (isCompoundPathNotation(str)) {
    return {type: 'location', locType: 'node', path: parseCompoundPath(str)}
  } else if (isComponent(str)) {
    return {type: 'query', queryType: 'component', query: str.slice(1)}
  } else if (isIndex(str)) {
    return {type: 'location', locType: 'node', index: str}
  } else if (isRoot(str)) {
    return {type: 'location', locType: 'node', path: []}
  } else {
    return {type: 'location', locType: 'node', path: [str]}
  }
}

/**
 * Returns the path that points to the node in the graph by its id. The id is preseved when moving or editing nodes.
 * The path might change. To fixate a node one can use the ID.
 * @param {string} id The id of the node
 * @param {PortGraph} graph The graph to search in
 * @returns {CompoundPath|null} The path to the node with the given ID.
 */
export const idToPath = curry((id, graph) => {
  // return graph.__internals.idMap[id] // speed up search by creating a idMap cache
  return nodesDeep(graph).find((n) => n.id === id).path
})

function locPath (loc, graph) {
  if (loc.path) {
    return loc.path
  } else if (loc.name) {
    // best guess is that the node is at the root level...
    return [loc.name]
  } else if (loc.index) {
    var node = idToPath(loc.index, graph)
    if (!node) {
      throw new Error('Unable to locate node with id: ' + loc.index + '.')
    }
    return node
  } else {
    throw new Error('Unable to process location. Not enough information to find node in the graph.')
  }
}

function fullLocation (loc, graph) {
  var path = locPath(loc, graph)
  var node = nodeByPath(path, graph) || {}
  return {type: 'location', locType: loc.locType,
    path, index: (loc.index) ? loc.index : node.id, name: (loc.name) ? loc.name : node.name
  }
}

/**
 * Create a new location from a given object
 * @param loc Any processable form of location. TODO: list alle formats.
 * @param {PortGraph} graph The graph in which the location is valid.
 * @returns {Location} A location object
 */
export function location (loc, graph) {
  if (typeof (loc) === 'string') {
    return fullLocation(fromString(loc), graph)
  } else if (Array.isArray(loc)) {
    return fullLocation({type: 'location', locType: 'node', path: loc}, graph)
  } else if (typeof (loc) === 'object' && isPort(loc)) {
    return fullLocation(merge(location(loc.node, graph), {type: 'location', locType: 'port', port: loc.port}), graph)
  } else if (typeof (loc) === 'object' && loc.id) {
    return fullLocation(fromString(loc.id), graph)
  } else if (typeof (loc) === 'object' && loc.name) {
    return fullLocation(fromString(loc.name), graph)
  } else if (typeof (loc) === 'object' && loc.path) {
    return fullLocation({type: 'location', locType: 'node', path: loc.path}, graph)
  } else {
    return {type: 'location', locType: 'invalid'}
//    throw new Error('Unknown location type: ' + JSON.stringify(loc))
  }
}

export function query (loc, graph) {
  return identifies(location(loc, graph))
}

function identifiesNode (loc, node) {
  return (isPort(node) && loc.index === node.node) ||
    (!isPort(node) && loc.index === node.id)
}

function identifiesPort (loc, port) {
  return loc.locType === 'port' && loc.port === port.port && identifiesNode(loc, port.node)
}

function isRootNode (n) {
  return typeof (n) === 'object' && n.path && n.path.length === 0
}

/**
 * Checks whether a location identifies the given object. This is true if
 * for example the location points to a node and the other object is the node.
 * Or if the other object is simply the ID of the node.
 * It also identifies a node if the location specifies the port. If you don't want
 * this behaviour use equals (it is the strict version of identifies).
 * @params {Location} location A location object.
 * @params other Any type that can be a location.
 * @returns True if the location identifies the object stored in other.
 */
export const identifies = curry((location, other) => {
  if (location.type === 'port') {
    if (!isPort(other)) {
      console.warn('Comparing port against non port. Will always return false!')
    }
    return isPort(other) && identifiesPort(location, other)
  } else if (isNode(other) || isRootNode(other) || isPort(other)) {
    return identifiesNode(location, other)
  } else {
    throw new Error('Unable to identify object type. Checking for: ' + JSON.stringify(location) + ' object is: ' + JSON.stringify(other))
  }
})
