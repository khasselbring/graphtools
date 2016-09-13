
import curry from 'lodash/fp/curry'
import flatten from 'lodash/fp/flatten'
import find from 'lodash/fp/find'
import merge from 'lodash/fp/merge'
import {isCompound, isCompoundPath, setPath as compoundSetPath} from '../compound'
import {fromString, isRoot, join, node as pathNode, parent as parhParent} from '../compoundPath'
import {isPort, node as portNode} from '../port'
import * as Node from '../node'
import * as changeSet from '../changeSet'
import {allowsReferences} from './basic'

/**
 * Returns a list of nodes on the root level.
 * @param {PortGraph} graph The graph.
 * @param {function} [predicate] An optional function that filters nodes. If no predicate function is given, all nodes are returned.
 * @returns {Nodes[]} A list of nodes.
 */
export const nodes = curry((predicate, graph) => {
  if (typeof (predicate) === 'function') {
    return graph.nodes.filter(predicate)
  } else {
    graph = predicate
  }
  return graph.nodes
})

function nodesDeepRec (graph, parents) {
  return flatten(parents.map(nodesDeep))
}

/**
 * Get all nodes at all depths. It will go into every compound node and return their nodes
 * and the nodes of their compound nodes, etc.
 * @param {PortGraph} graph The graph to work on
 * @param {String[]} baseCPath The base compound path for the node paths. This path specifies a list of parents and the actual node.
 * @returns {Node[]} A list of pairs. Each containing a compound path as the first element specifying a list of parents
 * that lead to the node in the graph. The second element is the corresponding node.
 */
export function nodesDeep (graph) {
  return nodes(graph)
    .concat(nodesDeepRec(graph, nodes(isCompound, graph)))
}

/**
 * Returns a list of node names. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of node names.
 */
export function nodeNames (graph) {
  return graph.nodes.map(Node.id)
}

/**
 * Returns the node given by the compound path.
 * @param {PortGraph} graph The graph.
 * @param {String[]} path A compound path specifying the node in the graph.
 * @returns {Node} The node in the graph
 * @throws {Error} If the compound path is invalid.
 */
function nodeByPathRec (graph, path, basePath) {
  if (typeof (path) === 'string' && isCompoundPath(path)) {
    path = fromString(path)
  } else if (!Array.isArray(path)) {
    throw new Error('Invalid argument for `nodeByPath`. An compound path (array of node ids) is required.')
  }
  basePath = basePath || path
  if (path.length === 0) {
    return graph
  }
  var curNode = node(path[0], graph)
  if (path.length > 1) {
    if (!isCompound(curNode)) {
      throw new Error('Expected "' + path[0] + '" to be a compound node in: ' + basePath)
    }
    return nodeByPathRec(path.slice(1), basePath, curNode)
  } else {
    return curNode
  }
}

export const nodeByPath = curry((path, graph) => {
  return nodeByPathRec(graph, path, path)
})

function isID (str) {
  return str[0] === '#'
}

/**
 * Returns the path that points to the node in the graph by its id. The id is preseved when moving or editing nodes.
 * The path might change. To fixate a node one can use the ID.
 */
export function idToPath (graph, id) {
  if (id[0] === '#') return idToPath(graph, id.slice(1))
  return graph.__internals.idMap[id]
}

/**
 * Returns the node with the given id. [Performance O(|V|)]
 * @param {Node|string} node The node, its id or its local name.
 * @param {PortGraph} graph The graph.
 * @returns {Node} The node in the graph
 * @throws {Error} If the queried node does not exist in the graph.
 */
export const node = curry((searchNode, graph) => {
  if (isPort(searchNode)) {
    return node(portNode(searchNode), graph)
  }
  if (isCompound(graph) && searchNode === '') {
    return graph
  }
  if (Array.isArray(searchNode) || isCompoundPath(searchNode)) {
    return nodeByPath(searchNode, graph)
  } else if (isID(searchNode)) {
    return nodeByPath(idToPath(graph, searchNode), graph)
  }
  var res = find(graph.nodes, Node.equal(searchNode))
  if (!res) {
    // TODO: debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    throw new Error(`Node with id '${Node.id(searchNode)}' does not exist in the graph.`)
  }
  return res
})

function hasNodeByPathRec (graph, path, basePath) {
  if (typeof (path) === 'string' && isCompoundPath(path)) {
    path = fromString(path)
  } else if (!Array.isArray(path)) {
    throw new Error('Invalid argument for `nodeByPath`. An compound path (array of node ids) is required.')
  }
  if (path.length === 0) {
    return graph
  }
  const nodeExists = hasNode(graph, path[0])
  if (path.length > 1 && nodeExists) {
    var curNode = node(graph, path[0])
    if (!isCompound(curNode)) {
      return false
//      throw new Error('Expected "' + path[0] + '" to be a compound node in query: "' + basePath + '"')
    }
    return hasNodeByPath(curNode, path.slice(1), basePath)
  } else if (!nodeExists) {
    return false
//    throw new Error('Could not find node "' + path[0] + '" while looking for ' + basePath + ' (remaining path: "' + path + '")')
  } else {
    return hasNode(graph, path[0])
  }
}

export const hasNodeByPath = curry((path, graph) => {
  return hasNodeByPathRec(graph, path, path)
})

/**
 * Checks whether the graph has a node with the given id. [Performance O(|V|)]
 * @param {Node|string} node The node or its id you want to check for.
 * @param {PortGraph} graph The graph.
 * @returns {boolean} True if the graph has a node with the given id, false otherwise.
 */
export const hasNode = curry((node, graph) => {
  if (isPort(node)) {
    return hasNode(portNode(node), graph)
  } else if (Array.isArray(node) || isCompoundPath(node)) {
    return hasNodeByPath(node, graph)
  }
  return !!find(graph.nodes, Node.equal(node))
})

function checkNode (graph, node) {
  if (allowsReferences(graph) && Node.isReference(node)) {
    if (hasNode(Node.name(node), graph)) {
      throw new Error('Cannot add a reference if the name is already used. Names must be unique in every compound. Tried to add reference: ' + JSON.stringify(node))
    }
    return
  }
  if (!node) {
    throw new Error('Cannot add undefined node to graph.')
  } else if (!Node.isValid(node)) {
    throw new Error('Cannot add invalid node to graph. Are you missing the id or a port?\nNode: ' + JSON.stringify(node))
  } else {
    if (hasNode(graph, Node.name(node))) {
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
export const addNodeByPath = curry((parentPath, nodeData, graph) => {
  if (isRoot(parentPath)) {
    return addNode(nodeData, graph)
  } else {
    var parentGraph = node(graph, parentPath)
    return replaceNode(parentPath, addNode(parentGraph, nodeData), graph)
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
export const addNode = curry((node, graph) => {
  if (hasNode(node, graph)) {
    throw new Error('Cannot add already existing node: ' + Node.id(node))
  }
  var newNode = Node.create(node)
  checkNode(graph, newNode)
  return changeSet.applyChangeSet(graph, changeSet.insertNode(setPath(newNode, Node.path(graph))))
})

/**
 * Removes a node from the graph. [Performance O(|V| + |E|)]
 * @param {CompoundPath} path The node that shall be removed, either the node object or the id.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph without the given node.
 */
export const removeNode = curry((path, graph) => {
  var parentPath = parhParent(path)
  if (parentPath.length === 0) {
    return changeSet.applyChangeSet(graph, changeSet.removeNode(path))
  }
  var parentGraph = node(parentPath, graph)
  // remove node in its compound and replace the graphs on the path
  return replaceNode(parentPath, removeNode(parentGraph, pathNode(path)), graph)
})

/* TODO FIX! Make sure that the id does not change */
export const replaceNode = curry((path, newNode, graph) => {
  return addNodeByPath(
    removeNode(path, graph),
    parhParent(path), newNode)
})

/**
 * Gets the parent of a node.
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node for which you want to get the parent.
 * @returns {Node} The node id of the parent node or undefined if the node has no parent.
 */
export const parent = curry((n, graph) => {
  return node(n, graph).parent
})
