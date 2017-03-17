/**
 * @module Graph.internal
 * @overview
 * This methods are for internal usage. They do not check for bad inputs and can create broken graphs.
 * If you know what you are doing you can include them via `import * as GraphInternals from '@buggyorg/graphtools/graph/internal'`.
 */

import { curry, flatten, pick, set, omit, merge } from 'lodash/fp'
import * as Node from '../node'
import { equal as pathEqual, isRoot, relativeTo, join, CompoundPath } from '../compoundPath'
import { setPath as compoundSetPath, hasChildren } from '../compound'
import * as changeSet from '../changeSet'
import { Portgraph } from './graph'
import { GraphAction } from './graphaction'
import { flowCallback } from './flow'
import { Port } from '../port'
import { Edge, DataflowEdge, NodeEdge } from '../edge'

/**
 * @description Returns a list of nodes on the root level.
 * @param {PortGraph} graph The graph.
 * @param {function} [predicate] An optional function that filters nodes. If no predicate function is given, all nodes are returned.
 * @returns {Nodes[]} A list of nodes.
 */
export function nodes(graph: Node.Node) {
  return (<Node.ParentNode>graph).nodes ? (<Node.ParentNode>graph).nodes : []
}

function nodesDeepRec(graph: Node.Node, parents: Node.Node[]): Node.Node[] {
  return flatten(parents.map(nodesDeepInternal))
}

function nodesDeepInternal(graph: Node.Node) {
  return nodes(graph)
    .concat(nodesDeepRec(graph, nodes(graph)))
}

/**
 * Get all nodes at all depths. It will go into every compound node and return their nodes
 * and the nodes of their compound nodes, etc.
 * @param {PortGraph} graph The graph to work on
 * @returns {Node[]} A list of nodes.
 */
export function nodesDeep(graph: Node.Node) {
  return nodesDeepInternal(graph).concat([graph])
}

/**
 * Returns a node that is located at a specific path in the graph.
 * @param {CompoundPath} path The path to the wanted node.
 * @param {PortGraph} graph The graph
 * @returns {Node|undefined} The node or undefined if the path does not exist.
 */
export function nodeByPath(path: CompoundPath, graph: Node.Node) {
  if (!path) return
  if (isRoot(path)) return graph
  return nodeBy((n) => pathEqual(path, n.path), graph)
  //  return nodeByPathRec(graph, path, path)
}

/**
 * Find a node using a predicate.
 * @param {Function} fn A function that decides for each node if it should be rejected or not
 * @param {PortGraph} graph The graph
 * @returns {Node|undefined} The first node that matches the predicate.
 */
export function nodeBy(fn: (node: Node.Node) => boolean, graph: Node.Node) {
  return nodesDeep(graph).filter(fn)[0]
}

/**
 * @description Returns the path that points to the node in the graph by its id. The id is preserved when moving or editing nodes.
 * The path might change. To fixate a node one can use the ID.
 * @param {string} id The id of the node
 * @param {PortGraph} graph The graph to search in
 * @returns {CompoundPath|null} The path to the node with the given ID.
 */
export function idToPath(id: string, graph: Node.Node) {
  // return graph.__internals.idMap[id] // speed up search by creating a idMap cache
  return nodesDeep(graph).find((n) => n.id === id).path
}

function replacePortIDs(port: Port, id: string, replaceId: string) {
  if (port.node === replaceId) return set('node', id, port) as Port
  else return port
}

function replaceEdgeIDs(edges: Edge[], id: string, replaceId: string) {
  return edges.map((edge) => {
    if (edge.layer === 'dataflow') {
      const dEdge = edge as DataflowEdge
      return set('to', replacePortIDs(dEdge.to, id, replaceId),
        set('from', replacePortIDs(dEdge.from, id, replaceId), edge))
    } else {
      const nEdge = edge as NodeEdge
      return set('to', (nEdge.to === replaceId) ? id : edge.to,
        set('from', (nEdge.from === replaceId) ? id : edge.from, edge))
    }
  }) as Edge[]
}

/**
 * @description Merges the contents of a node with the given data. This CAN destroy the structure of the
 * graph so be cautious and prefer updateNode whenever possible.
 * @param {Node} oldNode The old node that should get updated
 * @param {Object} newNode New values for the old node as an object that gets merged into the node.
 * @param {PortGraph} graph The graph
 * @param {Callback} [cb] A callback function that is called with the newly inserted node.
 * @returns {PortGraph} The new graph with the merged nodes.
 */
export function mergeNodes(oldNode, newNode): GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    var path = idToPath(newNode.id, graph)
    var mergeGraph = changeSet.applyChangeSet(graph,
      changeSet.updateNode(relativeTo(path, graph.path), merge(
        pick(['id', 'name', 'path'], oldNode), { edges: replaceEdgeIDs(newNode.edges || [], oldNode.id, newNode.id) })))
    return cb(nodeByPath(path, graph), mergeGraph)
  }
}

/**
 * Updates all pathes in the graph.
 * @param {PortGraph} graph The graph to update
 * @returns {PortGraph} The port graph with all valid paths.
 */
export const rePath = (graph) => {
  graph.path = graph.path || []
  return rePathRec(graph.path, graph)
}

function rePathRec(basePath: CompoundPath, graph: Node.Node) {
  nodes(graph).forEach((n) => {
    var newPath = join(basePath, Node.id(n))
    n.path = newPath
    if (hasChildren(n)) {
      rePathRec(newPath, n)
    }
  })
  return graph
}

function setPath(node: Node.Node, path: CompoundPath) {
  var nodePath = join(path, Node.id(node))
  if (hasChildren(node)) {
    return compoundSetPath(node as Node.ConcreteNode, nodePath, setPath)
  }
  return merge(node, { path: nodePath })
}

export const unID = (node: Node.Node) => {
  return omit(['id', 'path'], node)
}

export function addNodeInternal(node: Node.Node, checkNode: (graph: Portgraph, node: Node.Node) => void) {
  return <GraphAction>((graph: Portgraph, ...cbs) => {
    const cb = flowCallback(cbs)
    var newNode = setPath(Node.create(unID(node)), Node.path(graph))
    checkNode(graph, newNode)
    if (hasChildren(newNode)) {
      newNode = set('edges', replaceEdgeIDs(newNode.edges, newNode.id, node.id), newNode)
    }
    return cb(newNode, changeSet.applyChangeSet(graph, changeSet.insertNode(newNode)))
  })
}
