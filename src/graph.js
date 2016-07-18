
import _ from 'lodash'
import {packageVersion} from './internals'
import * as changeSet from './changeSet'
import * as Node from './node'
import * as Edge from './edge'
import debugLog from 'debug'

const debug = debugLog('graphtools')

/**
 * Compares two graphs for structural equality.
 * @param {Graphlib} graph1 One of the graphs to compare.
 * @param {Graphlib} graph2 The other the graph to compare.
 * @returns {boolean} True if both graphs are structually equal, false otherwise.
 */
export const equal = (graph1, graph2) => {
  return _.isEqual(graph1, graph2)
}

/**
 * Creates a new graph that has the exact same nodes and edges.
 * @param {Graphlib} graph The graph to clone
 * @returns {Graphlib} A clone of the input graph.
 */
export function clone (graph) {
  return _.cloneDeep(graph)
}

/**
 * Returns a list of node objects.
 * @param {PortGraph} graph The graph.
 * @returns {Nodes[]} A list of nodes.
 */
export function nodes (graph) {
  return graph.nodes
}

/**
 * Returns a list of node names. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of node names.
 */
export function nodeNames (graph) {
  return _.map(graph.nodes, Node.id)
}

/**
 * Returns the node with the given id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node.
 * @returns {Node} The node in the graph
 * @throws {Error} If the queried node does not exist in the graph.
 */
export function node (graph, node) {
  var res = _.find(graph.nodes, (n) => Node.equal(n, node))
  if (!res) {
    debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    throw new Error(`Node with id '${node}' does not exist in the graph.`)
  }
  return res
}

/**
 * Checks whether the graph has a node with the given id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node you want to check for.
 * @returns {boolean} True if the graph has a node with the given id, false otherwise.
 */
export function hasNode (graph, node) {
  return !!_.find(graph.nodes, (n) => Node.equal(n, node))
}

/**
 * Add a node to the graph, returns a new node. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node object that should be added.
 * @returns {PortGraph} A new graph that includes the node.
 */
export function addNode (graph, node) {
  if (!node) {
    throw new Error('Cannot add undefined node to graph.')
  } else if (hasNode(graph, node)) {
    throw new Error('Cannot add already existing node: ' + Node.id(node))
  } else if (!Node.isValid(node)) {
    throw new Error('Cannot add invalid node to graph. Are you missing the id or a port?\nNode: ' + JSON.stringify(node))
  }
  return changeSet.applyChangeSet(graph, changeSet.insertNode(node))
}

/**
 * Removes a node from the graph. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {Node|string} node The node that shall be removed, either the node object or the id.
 * @returns {PortGraph} A new graph without the given node.
 */
export function removeNode (graph, node) {
  return changeSet.applyChangeSet(graph, changeSet.removeNode(Node.id(node)))
}

/**
 * Returns a list of edges in the graph.
 * @param {PortGraph} graph The graph.
 * @returns {Edges[]} A list of edges.
 */
export function edges (graph) {
  return graph.edges
}

/**
 * Add an edge to the graph, either by specifying the ports to connect.
 * @param {PortGraph} graph The graph.
 * @param {Edge} edge The edge that should be added. This needn't be in standard format.
 * @param {Node} parent The parent of the edge.
 * @returns {PortGraph} A new graph containing the edge.
 * @throws {Error} If:
 *  - the edge already exists
 *  - ports that the edge connects do not exists
 *  - nodes that the edge connects do not exists
 *  - the edge is not in normalizable form.
 */
export function addEdge (graph, edge, parent) {
  var normEdge = Edge.normalize(graph, edge)
  parent = parent || edge.parent
  if (!hasNode(graph, normEdge.from)) {
    throw new Error('Cannot create edge connection from not existing node: ' + normEdge.from + ' to: ' + normEdge.to)
  } else if (!hasNode(graph, normEdge.to)) {
    throw new Error('Cannot create edge connection from: ' + normEdge.from + ' to not existing node: ' + normEdge.to)
  } else if (parent && !hasNode(graph, parent)) {
    throw new Error('Invalid parent for edge (' + normEdge.from + ' → ' + normEdge.to + '). The parent: ' + parent + ' does not exist in the graph.')
  } else if (normEdge.from === normEdge.to && normEdge.outPort === normEdge.inPort) {
    throw new Error('Cannot add loops to the port graph from=to=' + normEdge.from + '@' + normEdge.outPort)
  } else if (!Node.hasPort(node(graph, normEdge.from), normEdge.outPort)) {
    throw new Error('The source node "' + normEdge.from + '" does not have the outgoing port "' + normEdge.outPort + '".')
  } else if (!Node.hasPort(node(graph, normEdge.to), normEdge.inPort)) {
    throw new Error('The target node "' + normEdge.to + '" does not have the ingoing port "' + normEdge.inPort + '".')
  }
  normEdge.parent = parent
  return changeSet.applyChangeSet(graph, changeSet.insertEdge(normEdge))
}

/**
 * Checks whether the graph has the given edge.
 * @params {PortGraph} graph The graph.
 * @params {Edge} edge The edge to look for.
 * @returns {boolean} True if the edge is contained in the graph, false otherwise.
 */
export function hasEdge (graph, edge) {
  var normEdge = Edge.normalize(graph, edge)
  return !!_.find(graph.edges, (e) => Edge.equal(e, normEdge))
}

/**
 * Returns the queried edge.
 * @params {PortGraph} graph The graph.
 * @params {Edge} edge A edge mock that only contains the connecting ports but not necessarily further information.
 * @returns {Edge} The edge as it is stored in the graph.
 * @throws {Error} If the edge is not contained in the graph.
 */
export function edge (graph, edge) {
  var normEdge = Edge.normalize(graph, edge)
  var retEdge = _.find(graph.edges, (e) => Edge.equal(e, normEdge))
  if (!retEdge) {
    throw new Error('Edge is not defined in the graph: ' + JSON.stringify(edge))
  }
  return retEdge
}

/**
 * Returns the parent of an edge.
 * @params {PortGraph} graph The graph.
 * @params {Edge} edge A edge mock that only contains the connecting ports but not necessarily further information.
 * @returns {Node} The parent node identifier.
 * @throws {Error} If the edge is not contained in the graph.
 */
export function edgeParent (graph, inEdge) {
  var e = edge(graph, inEdge)
  return e.parent
}

/**
 * Sets the parent of a node.
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node for which you want to set the parent
 * @param {Node} [parent] Optional: The new parent of the node. If this is not defined
 * the new parent will be the root element, i.e. the node is not contained in any compound.
 * @returns {PortGraph} The new graph in which the parent is set.
 */
export function setParent (graph, n, parent) {
  if (!hasNode(graph, parent)) {
    debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    throw new Error('Cannot set the parent of a node to a non-existing node.\nParent: ' + parent)
  }
  node(graph, n).parent = parent
  return graph
}

/**
 * Checks whether the two nodes are connected via an edge.
 * @param {PortGraph} graph The graph in which we want to find the connection.
 * @param {Node} nodeFrom The starting point of our connection.
 * @param {Node} nodeTo The target of our connection.
 * @returns {boolean} True if the graph has an edge going from "nodeFrom" to "nodeTo".
 */
export function areConnected (graph, nodeFrom, nodeTo) {
  return !!_.find(graph.edges, (e) => e.from === nodeFrom && e.to === nodeTo)
}

/**
 * Returns the meta information encoded in the graph
 * @param {PortGraph} graph The graph.
 * @returns {object} An object with all meta information keys.
 */
export function meta (graph) {
  return graph.metaInformation
}

/**
 * Sets the meta information in the graph for the given key to the value
 * @param {PortGraph} graph The graph.
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @returns A new graph with the applied changes.
 */
export function setMeta (graph, key, value) {
  return changeSet.applyChangeSet(graph, changeSet.addMetaInformation(key, value))
}

/**
 * Returns a list of defined components. Components are not part of the program flow, but are defined
 * procedures that can be used in the resolve process.
 * @param {PortGraph} graph The graph.
 * @retuns {Components[]} A list of components that are defined in the graph.
 */
export function components (graph) {
  return graph.components
}

/**
 * Returns a list of predecessors for a node including the input port. Each node can only have exactly one
 * predecessor for every port.
 * @param {PortGraph} graph The graph.
 * @param {string} node The node for which we look for predecessors.
 * @returns {Port[]} A list of ports with their corresponding nodes
 */
export function predecessors (graph, node) {
  return _(graph.edges)
    .filter((e) => e.to === node)
    .map((e) => ({node: e.from, port: e.outPort, succeedingNode: e.from, succeedingPort: e.outPort}))
    .value()
}

/**
 * Returns the predecessors for a node including the input port. Each node can only have exactly one
 * predecessor for every port.
 * @param {PortGraph} graph The graph.
 * @param {string} node The node for which we look for predecessors.
 * @param {string} port The port to follow.
 * @returns {Port} The preceeding port with the corresponding node
 */
export function predecessor (graph, node, port) {
  return _(graph.edges)
    .filter((e) => e.to === node && e.inPort === port)
    .map((e) => ({node: e.from, port: e.outPort, succeedingNode: e.from, succeedingPort: e.outPort}))
    .first()
}

/**
 * Get the successors of one node in the graph, optionally for a specific port.
 * @param {PortGraph} graph The graph.
 * @param {string} node The node id.
 * @param {string|null} port An optional port, if you need only successors for the specific port.
 * @returns {Port[]} A list of ports that succeed the node with their corresponding nodes.
 */
export function successors (graph, node, port) {
  return _(graph.edges)
    .filter((e) => e.from === node && (!port || e.outPort === port))
    .map((e) => ({node: e.to, port: e.inPort, preceedingNode: e.from, preceedingPort: e.outPort}))
    .value()
}

/**
 * Returns a new empty graph.
 * @returns {PortGraph} A new empty port graph.
 */
export function empty () {
  return {
    nodes: [],
    metaInformation: {version: packageVersion()},
    edges: [],
    components: []
  }
}
