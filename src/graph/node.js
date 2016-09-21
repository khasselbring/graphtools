
import curry from 'lodash/fp/curry'
import flatten from 'lodash/fp/flatten'
// import find from 'lodash/fp/find'
import merge from 'lodash/fp/merge'
import omit from 'lodash/fp/omit'
import pick from 'lodash/fp/pick'
import {isCompound, setPath as compoundSetPath} from '../compound'
import {isRoot, join, node as pathNode, parent as pathParent} from '../compoundPath'
// import {isPort, node as portNode} from '../port'
import * as Node from '../node'
import * as changeSet from '../changeSet'
import {allowsReferences} from './basic'
import {chain} from './chain'
import {nodeByPath, nodeBy} from './internal'
import {location, idToPath, query} from '../location'

/**
 * Returns a list of nodes on the root level.
 * @param {PortGraph} graph The graph.
 * @param {function} [predicate] An optional function that filters nodes. If no predicate function is given, all nodes are returned.
 * @returns {Nodes[]} A list of nodes.
 */
export const nodes = (graph) => {
  return graph.nodes
}

/**
 * Returns a list of nodes on the root level.
 * @param {PortGraph} graph The graph.
 * @param {function} [predicate] An optional function that filters nodes. If no predicate function is given, all nodes are returned.
 * @returns {Nodes[]} A list of nodes.
 */
export const nodesBy = curry((predicate, graph) => {
  return nodes(graph).filter(predicate)
})

function nodesDeepRec (graph, parents) {
  return flatten(parents.map(nodesDeep))
}

/**
 * Get all nodes at all depths. It will go into every compound node and return their nodes
 * and the nodes of their compound nodes, etc.
 * @param {PortGraph} graph The graph to work on
 * @returns {Node[]} A list of nodes.
 */
export function nodesDeep (graph) {
  return nodes(graph)
    .concat(nodesDeepRec(graph, nodesBy(isCompound, graph)))
}

/**
 * Get all nodes at all depths that fulfill the given predicate. It will go into every compound node
 * and return their nodes and the nodes of their compound nodes, etc.
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

function nodeInternal (search, graph) {
  var loc = location(search, graph)
  var node
  switch (loc.type) {
    case 'location':
      node = nodeByPath(loc.path, graph)
      break
    default:
      return
  }
  return node
}

/**
 * Returns the node with the given id. [Performance O(|V|)]
 * @param {Node|string} node The node, its id or its local name.
 * @param {PortGraph} graph The graph.
 * @returns {Node} The node in the graph
 * @throws {Error} If the queried node does not exist in the graph.
 */
export const node = curry((searchNode, graph) => {
  var node = nodeBy(query(searchNode, graph), graph)
  if (!node) {
    throw new Error(`Node with id '${Node.id(searchNode)}' does not exist in the graph.`)
  }
  return node
})

/**
 * Checks whether the graph has a node with the given id. [Performance O(|V|)]
 * @param {Node|string} node The node or its id you want to check for.
 * @param {PortGraph} graph The graph.
 * @returns {boolean} True if the graph has a node with the given id, false otherwise.
 */
export const hasNode = curry((node, graph) => {
  return !!nodeInternal(node, graph)
})

function checkNode (graph, node) {
  if (allowsReferences(graph) && Node.isReference(node)) {
    if (Node.hasName(node) && hasNode(Node.name(node), graph)) {
      throw new Error('Cannot add a reference if the name is already used. Names must be unique in every compound. Tried to add reference: ' + JSON.stringify(node))
    }
    return
  }
  if (!node) {
    throw new Error('Cannot add undefined node to graph.')
  } else if (!Node.isValid(node)) {
    throw new Error('Cannot add invalid node to graph. Are you missing the id or a port?\nNode: ' + JSON.stringify(node))
  } else {
    if (Node.hasName(node) && hasNode(Node.name(node), graph)) {
      throw new Error('Cannot add a node if the name is already used. Names must be unique in every compound. Tried to add node: ' + JSON.stringify(node))
    }
  }
}

/**
 * Add a node at a specific path.
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
    return replaceNode(parentPath, addNode(nodeData, parentGraph), graph)
  }
})

function setPath (node, path) {
  var nodePath = join(path, Node.name(node))
  if (isCompound(node)) {
    return compoundSetPath(node, nodePath, setPath)
  }
  return merge(node, {path: nodePath})
}

/**
 * Add a node to the graph, returns a new graph. [Performance O(|V| + |E|)]
 * @param {Node} node The node object that should be added.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph that includes the node.
 */
export const addNode = curry((node, graph, ...cb) => {
  if (hasNode(unID(node), graph)) {
    throw new Error('Cannot add already existing node: ' + Node.name(node))
  }
  var newNode = Node.create(unID(node))
  checkNode(graph, newNode)
  if (cb.length > 0) {
    cb[0](newNode)
  }
  return changeSet.applyChangeSet(graph, changeSet.insertNode(setPath(newNode, Node.path(graph))))
})

/**
 * Removes a node from the graph. [Performance O(|V| + |E|)]
 * @param {CompoundPath} path The node that shall be removed, either the node object or the id.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph without the given node.
 */
export const removeNode = curry((path, graph, ...cb) => {
  var parentPath = pathParent(path)
  if (parentPath.length === 0) {
    if (cb.length > 0) {
      cb[0](node(path, graph))
    }
    return changeSet.applyChangeSet(graph, changeSet.removeNode(path))
  }
  var parentGraph = node(parentPath, graph)
  // remove node in its compound and replace the graphs on the path
  return replaceNode(parentPath, removeNode(pathNode(path), parentGraph, ...cb), graph)
})

const unID = (node) => {
  return omit(['id', 'path'], node)
}

const mergeNodes = curry((oldNode, newNode, graph) => {
  return changeSet.applyChangeSet(graph,
    changeSet.updateNode(idToPath(newNode.id, graph), pick(['id', 'name', 'path'], oldNode)))
})

/**
 * Updates all pathes in the graph.
 * @param {PortGraph} graph The graph to update
 * @returns {PortGraph} The port graph with all valid paths.
 */
const rePath = (graph) => {
  return rePathRec([], graph)
}

const rePathRec = (basePath, graph) => {
  nodes(graph).forEach((n) => {
    var newPath = join(basePath, Node.name(n))
    n.path = newPath
    if (isCompound(n)) {
      rePathRec(newPath, n)
    }
  })
  return graph
}

export const replaceNode = curry((path, newNode, graph) => {
  return chain(
    removeNode(path),
    addNodeByPath(pathParent(path), unID(newNode)),
    (graph, objs) => mergeNodes(objs()[0], objs()[1], graph),
    rePath
  )(graph)
})

/**
 * Gets the parent of a node.
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node for which you want to get the parent.
 * @returns {Node} The node id of the parent node or undefined if the node has no parent.
 */
export const parent = curry((n, graph) => {
  return node(pathParent(node(n, graph).path), graph)
})
