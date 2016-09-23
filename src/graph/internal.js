
// import find from 'lodash/fp/find'
import flatten from 'lodash/fp/flatten'
// import {equal as nodeEqual} from '../node'
import {isCompound} from '../compound'
import {equal as pathEqual} from '../compoundPath'

/**
 * Returns a list of nodes on the root level.
 * @param {PortGraph} graph The graph.
 * @param {function} [predicate] An optional function that filters nodes. If no predicate function is given, all nodes are returned.
 * @returns {Nodes[]} A list of nodes.
 */
export const nodes = (graph) => {
  return graph.nodes
}

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
    .concat(nodesDeepRec(graph, nodes(graph).filter(isCompound))).concat([graph])
}

// /**
//  * Returns the node given by the compound path.
//  * @param {PortGraph} graph The graph.
//  * @param {String[]} path A compound path specifying the node in the graph.
//  * @returns {Node} The node in the graph
//  * @throws {Error} If the compound path is invalid.
//  */
// function nodeByPathRec (graph, path, basePath) {
//   if (!Array.isArray(path)) {
//     throw new Error('Invalid argument for `nodeByPath`. An compound path (array of node ids) is required.')
//   }
//   if (path.length === 0) {
//     return graph
//   }
//   var curNode = find(nodeEqual(path[0]), nodes(graph))
//   if (!curNode) {
//     return curNode
//   }
//   if (path.length > 1 && !isCompound(curNode)) {
//     throw new Error('Expected "' + path[0] + '" to be a compound node in: ' + basePath)
//   }
//   return nodeByPathRec(curNode, path.slice(1), basePath)
// }

export function nodeByPath (path, graph) {
  if (!path) return
  return nodeBy((n) => pathEqual(path), graph)
//  return nodeByPathRec(graph, path, path)
}

export function nodeBy (fn, graph) {
  return nodesDeep(graph).filter(fn)[0]
}
