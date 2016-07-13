
import _ from 'lodash'
import {packageVersion} from './internals'
import changeSet from './changeSet'
import {id} from './node'

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
  return _.map(graph.nodes, id)
}

/**
 * Returns the node with the given id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {string} nodeId The id of the node.
 * @returns {Node} The node in the graph
 * @throws {Error} If no node with the given id exists
 */
export function node (graph, nodeId) {
  var node = _.find(graph.nodes, (n) => id(n) === nodeId)
  if (!node) {
    throw new Error(`Node with id '${nodeId}' does not exist in the graph.`)
  }
  return node
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
  return changeSet.applyChangeSet(graph, changeSet.removeNode(id(node)))
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
