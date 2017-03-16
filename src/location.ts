/**
 * A location is an object that defines a port or a node in the graph. A location can be one of the following:
 * - id,
 * - compound path
 * - node object
 * - port object.
 */

import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import {nodeByPath, idToPath, nodes} from './graph/internal'
import {Portgraph} from './graph/graph'
import {isPort, Port} from './port'
import {isValid as isNode, equal, id, isID, isReference, Node} from './node'
import {rest, prefix, fromString as cPathFromString, CompoundPath} from './compoundPath'

export interface Location {
  type: string
}

interface ConcreteLocation extends Location {
  locType: string
}

interface PortLocation extends ConcreteLocation {
  port: string
}

interface IndexLocation extends ConcreteLocation {
    index: string
}

interface PathLocation extends ConcreteLocation {
    path: string[]
}

interface NamedLocation extends ConcreteLocation {
  name: string
}

interface PortLocation extends ConcreteLocation {
  node: string
  port: string
}

interface QueryLocation extends Location {
    queryType: string
    query: string
}

type FullLocation = (PortLocation & IndexLocation & PathLocation & NamedLocation)

/** A port notation can have every of the other notations for the node and as such
 * it is necessary to check first if it is a port notation. The symbol '@' is only used in
 * port notations.
 */
function isPortNotation (str:string) {
  return str.indexOf('@') !== -1
}

function isCompoundPathNotation (str:string) {
  return !isPortNotation(str) && str[0] === '»'
}

function isComponent (str:string) {
  return !isPortNotation(str) && str[0] === '/'
}

function isIndex (str:string) {
  return !isPortNotation(str) && str[0] === '#'
}

function isRoot (str:string) {
  return str === ''
}

function parsePortNotation (port:string):PortLocation {
  var split = port.split('@')
  if (split[1] === '') {
    throw new Error('Invalid port notation. Port notation does not contain a port. Parsed port: ' + port)
  }
  return <PortLocation>(merge(fromString(split[0], false), {type: 'location', locType: 'port', port: split[1]}))
}

const parseCompoundPath = cPathFromString

/** Creates a location object from the string representation */
function fromString (str:string, allowsPorts = true):Location {
  if (isPortNotation(str)) {
    if (!allowsPorts) {
      throw new Error('Found unexpected port notation. Do you have multiple @\'s in your location string?')
    }
    return parsePortNotation(str)
  } else if (isCompoundPathNotation(str)) {
    return <PathLocation>{type: 'location', locType: 'node', path: parseCompoundPath(str)}
  } else if (isComponent(str)) {
    return <QueryLocation>{type: 'query', queryType: 'component', query: str.slice(1)}
  } else if (isIndex(str)) {
    return <IndexLocation>{type: 'location', locType: 'node', index: str}
  } else if (isRoot(str)) {
    return <PathLocation>{type: 'location', locType: 'node', path: []}
  } else {
    return <PathLocation>{type: 'location', locType: 'node', path: [str]}
  }
}

function idify (path:CompoundPath, graph:Node):CompoundPath {
  if (path.length === 0) return path
  var node = nodes(graph).filter((n) => equal(path[0], n))[0]
  if (!node) {
    if (equal(path[0], graph)) {
      return [id(graph)].concat(idify(rest(path), graph))
    }
    return
  }
  return [id(node)].concat(idify(rest(path), node))
}

function isPathLocation (loc:Location) {
  return loc.type === 'location' && (<ConcreteLocation>loc).locType === 'path'
}

function isNamedLocation (loc:Location) {
  return loc.type === 'location' && (<ConcreteLocation>loc).locType === 'node' && !!(<any>loc).name
}

function isIndexedLocation (loc:Location) {
  return loc.type === 'location' && (<ConcreteLocation>loc).locType === 'node' && !!(<any>loc).index
}

function isPortLocation (loc:Location) {
  return loc.type === 'location' && isPort((<any>loc))
}

function locPath (loc:Location, graph:Node) {
  var graphPath = graph.path
  if (isPathLocation(loc)) {
    let idPath = idify((loc as PathLocation).path, graph)
    return (idPath) ? prefix(idPath, graphPath) : undefined
  } else if (isNamedLocation(loc)) { // else if (loc.name) {
    // best guess is that the node is at the root level...
    let idPath = idify([(loc as NamedLocation).name], graph)
    return (idPath) ? prefix(idPath, graphPath) : undefined
  } else if (isIndexedLocation(loc)) {
    var nodePath = idToPath((loc as IndexLocation).index, graph)
    if (!nodePath) {
      throw new Error('Unable to locate node with id: ' + (loc as IndexLocation).index + '.')
    }
    return prefix(nodePath, graphPath)
  } else {
    throw new Error('Unable to process location. Not enough information to find node in the graph.')
  }
}

function fullLocation (loc:Location, graph:Node):FullLocation|QueryLocation {
  if (loc.type === 'query') return <QueryLocation>loc
  var path = locPath(loc, graph)
  var node = <Node>(<any>nodeByPath(path, graph))
  if (!node) {
    throw new Error('[graphtools/location] Unable to locate node with path: ' + path)
  }
  return <FullLocation>{
    type: 'location',
    locType: (<any>loc).locType,
    path,
    index: ((<any>loc).index) ? (<any>loc).index : node.id,
    name: ((<any>loc).name) ? (<any>loc).name : node.name,
    port: (<any>loc).port
  }
}

/**
 * Create a new location from a given object
 * @param loc Any processable form of location. TODO: list all formats.
 * @param {PortGraph} graph The graph in which the location is valid.
 * @returns {Location} A location object
 * @throws {Error} The Location object is not parsable.
 */
export function location (loc:any, graph:Node):Location {
  if (typeof (loc) === 'string') {
    return fullLocation(fromString(loc), graph)
  } else if (Array.isArray(loc)) {
    return fullLocation(<PathLocation>{type: 'location', locType: 'node', path: loc}, graph)
  } else if (isPortLocation(loc)) {
    const portLoc = loc as PortLocation
    var locObj = location(portLoc.node, graph)
    var merged = (locObj.type === 'query')
      ? merge({locType: 'port', port: portLoc.port}, location(portLoc.node, graph))
      : merge(location(portLoc.node, graph), {type: 'location', locType: 'port', port: portLoc.port})
    return fullLocation(merged, graph)
  } else if (isIndexedLocation(loc)) {
    return fullLocation(fromString(loc.id), graph)
  } else if (isNamedLocation(loc)) {
    return fullLocation(fromString(loc.name), graph)
  } else if (isPathLocation(loc)) {
    return fullLocation(<PathLocation>{type: 'location', locType: 'node', path: loc.path}, graph)
  } else {
    throw new Error('Unknown location type: ' + toString(loc))
  }
}

/**
 * Create a query function for a location.
 * @param {String|Location} loc A location identifier.
 * @param {PortGraph} graph The graph in which the location is valid.
 * @returns {function} A function that takes another location or location identifier
 * and compares it to the specified location `loc`. See `Location.identifies`.
 */
export function query (loc, graph:Node) {
  return identifies(location(loc, graph))
}

function nodeLocationIdentifiesPort (loc:ConcreteLocation, port:Port) {
  if (isIndex(port.node)) {
    return (<IndexLocation>loc).index === port.node
  } else {
    return (<NamedLocation>loc).name === port.node
  }
}

function identifiesNodeLocation (loc:ConcreteLocation, node:Node|Port) {
  return (isPort(node) && nodeLocationIdentifiesPort(loc, node as Port)) ||
    (!isPort(node) && (<IndexLocation>loc).index === (node as Node).id)
}

function identifiesPort (loc:FullLocation, port:Port) {
  return loc.locType === 'port' && loc.port === port.port && nodeLocationIdentifiesPort (loc, port)
}

function isRootNode (n) {
  return typeof (n) === 'object' && n.path && n.path.length === 0
}

/**
 * @description Checks whether a location identifies the given object. This is true if
 * for example the location points to a node and the other object is the node.
 * Or if the other object is simply the ID of the node.
 * It also identifies a node if the location specifies the port. If you don't want
 * this behavior use equals (it is the strict version of identifies).
 * @params {Location} location A location object.
 * @params other Any type that can be a location.
 * @returns True if the location identifies the object stored in other.
 */
export function identifies (loc:Location) {
  return (other) => {
    if (loc.type === 'query') {
      const qLoc = loc as QueryLocation
      if (qLoc.queryType === 'component') {
        if (isReference(other)) {
          return other.ref === qLoc.query
        }
        if (isPort(other)) {
          return identifies(qLoc)(other.additionalInfo)
        }
        return other.componentId === qLoc.query
      } else {
        throw new Error('[graphtools/location] Unknown query type: "' + qLoc.queryType + '"')
      }
    } else {
      const fLoc = loc as FullLocation
      if (fLoc.locType === 'port' && isPort(other)) {
        return isPort(other) && identifiesPort(fLoc, other)
      } else if (fLoc.locType === 'node' && isID(other)) {
        return equal(fLoc, other)
      } else if (isNode(other) || isRootNode(other) || isPort(other)) {
        return identifiesNodeLocation(fLoc, other)
      } else {
        throw new Error('Unable to identify object type. Checking for: ' + toString(loc))
      }
    }
  }
}

export const toString = (loc:Location) => {
  return JSON.stringify(loc)
}
