
import _ from 'lodash'
import {packageVersion} from './internals'
import * as changeSet from './changeSet'
import * as Node from './node'
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
  return _.clone(graph)
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

export function hasNode (graph, node) {
  return !!_.find(graph.nodes, (n) => Node.equal(n, node))
}

/**
 * Checks whether the graph has a node with the given id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {string} nodeId The id of the node.
 * @returns {boolean} True if the graph has a node with the given id, false otherwise.
 */
export function hasNode (graph, nodeId) {
  return !!_.find(graph.nodes, (n) => id(n) === nodeId)
}

/**
 * Add a node to the graph, returns a new node. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node object that should be added.
 * @returns {PortGraph} A new graph that includes the node.
 */
export function addNode (graph, node) {
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
 * Add an edge to the graph, either by specifying the edge object.
 * @param {PortGraph} graph The graph.
 * @param {Edge} edge The edge data type in the format {from: <nodeId>, to: <nodeId>, outPort: <fromPortName>, inPort: <toPortName>} or
 * using the colon separator like this: {from: `<nodeId>:<portName>`, to: `<nodeId>:<portName>`}.
 * @returns {PortGraph} A new graph containing the edge.
 *//**
 * Add an edge to the graph, either by specifying the ports to connect.
 * @param {PortGraph} graph The graph.
 * @param {Port} from The port from where to draw the connection.
 * @param {Port} to The port to the target of the connection.
 * @param {string} [type] An optional type of the edge.
 * @returns {PortGraph} A new graph containing the edge.
 */
export function addEdge (graph, from, to, type) {
  if (arguments.length === 2) {
    if (!hasNode(from.from)) {
      throw new Error('Cannot create edge connection from not existing node: ' + from.from + ' to: ' + from.to)
    }
    if (!hasNode(from.to)) {
      throw new Error('Cannot create edge connection from not existing node: ' + from.from + ' to: ' + from.to)
    }
    return changeSet.applyChangeSet(graph, changeSet.insertEdge(from))
  } else {
    return addEdge({
      from: from.node,
      outPort: from.port,
      to: to.node,
      inPort: to.port,
      type
    })
  }
}

/**
 * Add an edge to the graph.
 * @param {PortGraph} graph The graph.
 * @param {Edge} edge The edge that should be added. This needn't be in standard format.
 * @param {Node} parent The parent of the edge.
 * @returns {PortGraph} A new port graph that has the specified edge.
 * @throws {Error} If:
 *  - the edge already exists
 *  - ports that the edge connects do not exists
 *  - nodes that the edge connects do not exists
 *  - the edge is not in normalizable form.
 */
export function addEdge (graph, edge) {
  // var normEdge = Edge.normalize(graph, edge, parent)
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
