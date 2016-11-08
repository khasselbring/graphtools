
import curry from 'lodash/fp/curry'
import flatten from 'lodash/fp/flatten'
// import find from 'lodash/fp/find'
// import flow from './flow'
import merge from 'lodash/fp/merge'
import omit from 'lodash/fp/omit'
import setObj from 'lodash/fp/set'
import {isCompound, setPath as compoundSetPath} from '../compound'
import {isRoot, join, rest as pathRest, base as pathBase, parent as pathParent, isCompoundPath, relativeTo, equal} from '../compoundPath'
import {normalize as normalizePort} from '../port'
import * as Node from '../node'
import * as changeSet from '../changeSet'
import {allowsReferences} from './basic'
import {flow} from './flow'
import {nodeBy, mergeNodes, rePath, replaceEdgeIDs} from './internal'
import {query} from '../location'
import {incidents} from './connections'
import {removeEdge} from './edge'

/**
 * @function
 * @name nodes
 * @description Returns a list of nodes on the root level.
 * @param {PortGraph} graph The graph.
 * @returns {Nodes[]} A list of nodes.
 */
export const nodes = (graph) => {
  return graph.nodes || []
}

/**
 * @function
 * @name nodesBy
 * @description Returns a list of nodes on the root level selected by a given predicate.
 * @param {function} predicate A function that filters nodes.
 * @param {PortGraph} graph The graph.
 * @returns {Nodes[]} A list of nodes.
 */
export const nodesBy = curry((predicate, graph) => {
  return nodes(graph).filter(predicate)
})

function nodesDeepRec (graph, parents) {
  return flatten(parents.map(nodesDeep))
}

/**
 * Get all nodes at all depths. It will go into every compound node / lambda node and return their nodes
 * and the nodes of their compound nodes, etc.
 * @param {PortGraph} graph The graph to work on
 * @returns {Node[]} A list of nodes.
 */
export function nodesDeep (graph) {
  return nodes(graph)
    .concat(nodesDeepRec(graph, nodesBy(isCompound, graph)))
}

/**
 * @function
 * @name nodesDeepBy
 * @description Get all nodes at all depths that fulfill the given predicate. It will go into every compound node
 * and return their nodes and the nodes of their compound nodes, etc.
 * @param {function} predicate A function that filters nodes.
 * @param {PortGraph} graph The graph to work on
 * @returns {Node[]} A list of nodes that fulfill the predicate.
 */
export const nodesDeepBy = curry((predicate, graph) => {
  return nodesDeep(graph).filter(predicate)
})

/**
 * Returns a list of node names. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of node names.
 */
export function nodeNames (graph) {
  return nodes(graph).map(Node.id)
}

/**
 * @function
 * @name node
 * @description Returns the node at the given location. [Performance O(|V|)]
 * @param {Location} loc A location identifying the node.
 * @param {PortGraph} graph The graph.
 * @returns {Node} The node in the graph
 * @throws {Error} If the queried node does not exist in the graph.
 */
export const node = curry((loc, graph) => {
  var node = nodeBy(query(loc, graph), graph)
  if (!node) {
    throw new Error(`Node: '${Node.id(loc) || JSON.stringify(loc)}' does not exist in the graph.`)
  }
  return node
})

/**
 * @function
 * @name port
 * @description Returns a port specified by the short notation or a port query object. [Performance O(|V|)]
 * @param {Port} port A port object or a short notation for a port.
 * @param {PortGraph} graph The graph.
 * @returns {Node} The actual port object with type information.
 * @throws {Error} If the queried port does not exist in the graph.
 */
export const port = curry((port, graph) => {
  var nodeObj = node(port, graph)
  return Node.port(normalizePort(port), nodeObj)
})

/**
 * @function
 * @name hasNode
 * @description Checks whether the graph has a node. [Performance O(|V|)]
 * @param {Location} loc A location identifying the node
 * @param {PortGraph} graph The graph.
 * @returns {boolean} True if the graph has a node with the given id, false otherwise.
 */
export const hasNode = curry((loc, graph) => {
  return !!nodeBy(query(loc, graph), graph)
})

function checkNode (graph, node) {
  if (allowsReferences(graph) && Node.isReference(node)) {
    if (Node.hasName(node) && hasNode(Node.name(node), graph) && !Node.equal(unID(node), graph)) {
      throw new Error('Cannot add a reference if the name is already used. Names must be unique in every compound. Tried to add reference: ' + JSON.stringify(node))
    }
    return
  }
  if (!node) {
    throw new Error('Cannot add undefined node to graph.')
  } else if (!Node.isValid(node)) {
    throw new Error('Cannot add invalid node to graph. Are you missing the id or a port?\nNode: ' + JSON.stringify(node))
  } else {
    if (Node.hasName(node) && hasNode(Node.name(node), graph) && !Node.equal(unID(node), graph)) {
      throw new Error('Cannot add a node if the name is already used. Names must be unique in every compound. Tried to add node: ' + JSON.stringify(node))
    }
  }
}

/**
 * @function
 * @name addNodeByPath
 * @description Add a node at a specific path.
 * @param {CompoundPath} parentPath A compound path identifying the location in the compound graph.
 * @param {Node} node The node to add to the graph.
 * @param {PortGraph} graph The graph that is the root for the nodePath
 * @returns {PortGraph} A new graph that contains the node at the specific path.
 */
export const addNodeByPath = curry((parentPath, nodeData, graph, ...cb) => {
  if (isRoot(parentPath)) {
    return addNode(nodeData, graph, ...cb)
  } else {
    var parentGraph = node(parentPath, graph)
    return replaceNode(parentPath, addNode(nodeData, parentGraph, ...cb), graph)
  }
})

/**
 * @function
 * @name addNodeIn
 * @description Add a node in a given compound node.
 * @param {Location} parentLoc A location identifying the parent for the new node.
 * @param {Node} node The node to add to the graph.
 * @param {PortGraph} graph The graph
 * @returns {PortGraph} A new graph that contains the node as child of `parentLoc`.
 */
export const addNodeIn = curry((parentLoc, nodeData, graph, ...cb) => {
  return addNodeByPath(Node.path(node(parentLoc, graph)), nodeData, graph, ...cb)
})

function setPath (node, path) {
  var nodePath = join(path, Node.id(node))
  if (isCompound(node)) {
    return compoundSetPath(node, nodePath, setPath)
  }
  return merge(node, {path: nodePath})
}

/*
function replaceIdInPort (oldId, newId, port, layer) {
  if (layer === 'dataflow') {
    return merge(port, {node: (port.node === oldId) ? newId : port.node})
  } else {
    return (port === oldId) ? newId : port
  }
}

function replaceId (oldId, newId, edge) {
  return merge(edge, {
    from: replaceIdInPort(oldId, newId, edge.from, edge.layer),
    to: replaceIdInPort(oldId, newId, edge.to, edge.layer)
  })
}*/

/**
 * @function
 * @name addNode
 * @description Add a node to the graph (at the root level), returns a new graph. [Performance O(|V| + |E|)]
 * @param {Node} node The node object that should be added. If the node already exists in the graph it will be copied.
 *   The node object must contain at least one valid ports. This functions checks if the node has ports AND if
 *   every port is a valid port (i.e. has a name as `port` and the port type (output/input) as `kind`).
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph that includes the node.
 */
export const addNode = curry((node, graph, ...cb) => {
  var newNode = setPath(Node.create(unID(node)), Node.path(graph))
  if (hasNode(unID(newNode), graph) && !Node.equal(unID(newNode), graph)) {
    throw new Error('Cannot add already existing node: ' + Node.name(node))
  }
  checkNode(graph, newNode)
  if (isCompound(newNode)) {
    newNode = setObj('edges', replaceEdgeIDs(newNode.edges, newNode.id, node.id), newNode)
  }
  if (cb.length > 0) {
    cb[0](newNode)
  }
  return changeSet.applyChangeSet(graph, changeSet.insertNode(newNode))
})

/**
 * @function
 * @name set
 * @description Sets properties for node.
 * @param {Object} value The properties to set, e.g. `{recursion: true, recursiveRoot: true}`
 * @param {Location} loc The location identifying the node in which the property should be changed.
 * @param {PortGraph} graph The graph
 * @returns {PortGraph} A graph in which the change is realized.
 */
export const set = curry((value, loc, graph) => {
  var nodeObj = node(loc, graph)
  return replaceNode(nodeObj, Node.set(value, nodeObj), graph)
})

/**
 * @function
 * @name addNodeTuple
 * @description Add a node an return an array of the graph and id.
 * @param {Node} node The node object that should be added. If the node already exists in the graph it will be copied.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph that includes the node and the id as an array in [graph, id].
 */
export const addNodeTuple = curry((node, graph, ...cb) => {
  var id
  var newGraph = flow(
    addNode(node),
    (graph, objs) => { id = Node.id(objs()[0]); return graph }
  )(graph)
  return [newGraph, id]
})

/**
 * @function
 * @name get
 * @description Get a property of a node.
 * @param {String} key The key of the property like 'recursion'
 * @param {Location} loc The location identifying the node for which the property is queried.
 * @param {PortGraph} graph The graph.
 * @returns The value of the property or undefined if the property does not exist in the node.
 */
export const get = curry((key, nodeQuery, graph) => Node.get(key, node(nodeQuery, graph)))

const removeNodeInternal = curry((query, deleteEdges, graph, ...cb) => {
  var remNode = node(query, graph)
  var path = relativeTo(remNode.path, graph.path)
  var basePath = pathBase(path)
  if (basePath.length === 0) {
    if (cb.length > 0) {
      cb[0](remNode)
    }
    var remEdgesGraph = graph
    if (deleteEdges) {
      var inc = incidents(path, graph)
      remEdgesGraph = inc.reduce((curGraph, edge) => removeEdge(edge, curGraph), graph)
    }
    return changeSet.applyChangeSet(remEdgesGraph, changeSet.removeNode(remNode.id))
  }
  var parentGraph = node(basePath, graph)
  // remove node in its compound and replace the graphs on the path
  return replaceNode(basePath, removeNode(pathRest(path), parentGraph, ...cb), graph)
})

/**
 * @function
 * @name removeNode
 * @description Removes a node from the graph. [Performance O(|V| + |E|)]
 * @param {Location} loc The location identifying the node to delete.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph without the given node.
 */
export const removeNode = curry((loc, graph, ...cb) => {
  return removeNodeInternal(loc, true, graph, ...cb)
})

const unID = (node) => {
  return omit(['id', 'path'], node)
}

function nodeParentPath (path, graph) {
  if (isCompoundPath(path)) {
    return pathParent(path)
  } else {
    return pathParent(node(path, graph).path)
  }
}

/**
 * @function
 * @name replaceNode
 * @description Replace a node in the graph with another one. It tries to keep all edges.
 * TODO: currently it will silently ignore the fact that edges are not valid anymore after replacing!
 * @param {Location} loc A location specifying the node to replace
 * @param {Node} newNode The new node that replaces the old one.
 * @param {PortGraph} graph The graph
 * @returns {PortGraph} A new graph in which the old node was replaces by the new one.
 */
export const replaceNode = curry((path, newNode, graph) => {
  return flow(
    removeNodeInternal(path, false),
    addNodeByPath(nodeParentPath(path, graph), newNode),
    (graph, objs) => mergeNodes(objs()[0], objs()[1], graph),
    rePath
  )(graph)
})

/**
 * @function
 * @name parent
 * @description Gets the parent of a node.
 * @param {Location} loc A location identifying the node whose parent is wanted.
 * @param {PortGraph} graph The graph.
 * @returns {Node} The node id of the parent node or undefined if the node has no parent.
 */
export const parent = curry((loc, graph) => {
  if (equal(node(loc, graph).path, graph.path)) {
    // parent points to a node not accessible from this graph (or loc is the root of the whole graph)
    return
  }
  return node(pathParent(relativeTo(node(loc, graph).path, graph.path)), graph)
})
