
/** @module utils */

import _ from 'lodash'

/**
 * A link is a connection between two nodes that can extend over multiple compound nodes. But it can never leave a recursion.
 * @typedef {Object} Link
 */

/**
 * Applies the name prefixing for e.g. path names or similar stuff.
 * @param {String} prefix The prefix for the name.
 * @param {String} name The name to prefix.
 * @returns {String} The prefixed name.
 */
export function prefixName (prefix, name) {
  return `${prefix}:${name}`
}

/**
 * Returns whether the graph is a network-port-graph (i.e. has nodes that have ports).
 * @param {Graphlib} graph A graphlib graph
 * @returns {boolean} True if the graph is a network-port-graph, false otherwise.
 */
export function isNPG (graph) {
  return !isNG(graph)
}

/**
 * Checks whether the graph is a network-graph (i.e. process nodes and port nodes).
 * @param {Graphlib} graph A graphlib graph
 * @returns {boolean} True if the graph is a network-graph, false otherwise.
 */
export function isNG (graph) {
  return _.filter(graph.nodes(), (n) => n.indexOf('_PORT_') !== -1).length !== 0
}

/**
 * Returns true if the node is a port node (in an NG), false otherwise.
 * @param {string} nodeName The name of the port node.
 * @returns {boolean} True if it is a port node, false otherwise.
 */
export function isPortNode (nodeName) {
  return nodeName.split('_PORT_').length === 2
}

/**
 * Returns the name of the port that the port node represents.
 * @param {string} nodeName The name of the port node.
 * @returns {string} The port name of port node.
 */
export function portNodePort (nodeName) {
  return nodeName.split('_PORT_')[1]
}

/**
 * Returns the name of the node that the port node is connected to.
 * @param {string} nodeName The name of the port node.
 * @returns {string} The name of the process of this port node.
 */
export function portNodeName (nodeName) {
  return nodeName.split('_PORT_')[0]
}

/** Returns the n-th input of the given node (as a name) in the graph.
 * @param {Graphlib} graph The graph
 * @param {string} node The node identifier
 * @param {number} n The index of the input argument (starts at 0)
 * @returns {string} The port name
 */
export function nthInput (graph, node, n) {
  var inputs = graph.node(node).inputPorts
  return _.keys(inputs)[n]
}

/** Returns the n-th output of the given node (as a name) in the graph.
 * @param {Graphlib} graph The graph
 * @param {string} node The node identifier
 * @param {number} n The index of the output argument (starts at 0)
 * @returns {string} The port name
 */
export function nthOutput (graph, node, n) {
  var outputs = graph.node(node).outputPorts
  return _.keys(outputs)[n]
}

/** Creates a new node whose name has the prefix `prefix`.
 * @param {string} prefix The prefix for the node
 * @param {Object} node The graphlib node object.
 * @returns {Object} A new graphlib node object that has prefixed names.
*/
export function prefixNode (prefix, node) {
  return _.merge({}, node, {v: prefixName(prefix, node.v)})
}

/**
 * Adds a reference to parent to the node `node` (given as a graphlib node object).
 * @param {string} parent Identifies the parent node
 * @param {Object} node The graphlib node object.
 * @returns {Object} Returns the new node, does not change the old one.
 */
export function addParent (parent, node) {
  return _.merge({}, node, {parent: parent})
}

/**
 * Returns an array of all the parents and the parents parents of the given node.
 * @param {Graphlib} graph The graph
 * @param {string} node The identifier for the node.
 * @returns {string[]} A list of compound nodes that are the parents of this node.
 */
export function hierarchy (graph, node, h = []) {
  return (node) ? hierarchy(graph, graph.parent(node), _.concat([node], h)) : h
}

/**
 * Returns all hierarchy borders that lie between two nodes connected by an link.
 * @param {Graphlib} The graph
 * @param {Link} edge The link between the two nodes
 * @returns {Object[]} It returns an array of objects that all are in the format: {node: 'COMPOUND_ID', type: 'in/out'}.
 * The type indicates if the edge is going into or out of the compound.
 */
export function rawHierarchyConnection (graph, link) {
  var hFrom = hierarchy(graph, link.v).slice(0, -1).map((f) => ({node: f, type: 'out'}))
  var hTo = hierarchy(graph, link.w).slice(0, -1).map((t) => ({node: t, type: 'in'}))
  var hCon = _.dropWhile(_.zip(hFrom, hTo), (z) => {
    return z[0] && z[1] && z[0].node === z[1].node
  })
  var unzipH = _.unzip(hCon)
  return _.concat(_.compact(_.flatten([_.reverse(unzipH[0]), unzipH[1]])))
}

/**
 * Generates a name for the link (a connection between nodes that not necessarily have the same parent).
 * @param {Link} link The link
 * @returns {string} A unique name for this link (unique by input/output node).
 */
export function linkName (link, portNames = true) {
  var value = link.value || {}
  if (portNames) {
    return `[${link.v}@${value.outPort}→${link.w}@${value.inPort}]`
  } else {
    return `[${link.v}→${link.w}]`
  }
}

/**
 * Returns all hierarchy borders that lie between two nodes connected by an link.
 * @param {Graphlib} The graph
 * @param {Link} link The link between the two nodes
 * @returns {Object[]} It returns an array of compounds between the two nodes.
 */
export function hierarchyConnection (graph, link) {
  var hFrom = hierarchy(graph, link.v).slice(0, -1)
  var hTo = hierarchy(graph, link.w).slice(0, -1)
  var hCon = _.dropWhile(_.zip(hFrom, hTo), (f) => f[0] === f[1])
  var unzipH = _.unzip(hCon)
  return _.concat(_.compact(_.flatten([_.reverse(unzipH[0]), unzipH[1]])))
}

export function isConformityPort (p) {
  return p.indexOf('[') === 0 && p.indexOf(']') === p.length - 1
}

export function isConformityEdge (e) {
  return isConformityPort(e.value.inPort) || isConformityPort(e.value.outPort)
}

/**
 * Returns all nodes (as names) in the graph that have the given id (e.g. all math/add nodes).
 * @param {Graphlib} graph The graph
 * @param {string} id The id of the nodes to query.
 * @returns {string[]} A list of nodes that all have the given id.
 */
export function getAll (graph, id) {
  return _.filter(graph.nodes(), (n) => graph.node(n).id === id || graph.node(n).meta === id)
}

/**
 * Returns all ports (input and output) of a given node.
 * @param {Graphlib} graph The graph
 * @param {string} node The string identifying the node.
 * @returns {Object} An object whose keys are the port names and whose values are the port types.
 */
export function ports (graph, node) {
  var curNode = graph.node(node)
  return _.merge({}, curNode.inputPorts, curNode.outputPorts)
}

/**
 * Returns the type of the given port of node independent of its type (input or output).
 * @param {Graphlib} graph The graph
 * @param {string} node The string identifying the node.
 * @param {string} port The name of the port (either input or output)
 * @returns {string} The type of the port.
 */
export function portType (graph, node, port) {
  return ports(graph, node)[port]
}

/**
 * Sets the type of the given port of `node` to `type`. It automatically determines if it is an input or output port.
 * The function has side effects and changes the graph.
 * @param {Graphlib} graph The graph
 * @param {string} node The string identifying the node.
 * @param {string} port The name of the port (either input or output)
 * @param {string} type The new type of the port.
 */
export function setPortType (graph, node, port, type) {
  var ports = (graph.node(node).inputPorts[port]) ? graph.node(node).inputPorts : graph.node(node).outputPorts
  ports[port] = type
}

/**
 * Gets the direction type of a port. I.e. it returns `inputPorts` or `outputPorts`.
 * @param {Graphlib} graph The graph
 * @param {string} node The string identifying the node.
 * @param {string} port The name of the port (either input or output)
 * @returns {string} Either `inputPorts or `outputPorts`.
 * @throws {Error} Throws an error if the port does not exist.
 */
export function portDirectionType (graph, node, port) {
  var curNode = graph.node(node)
  if (_.has(curNode.inputPorts, port)) {
    return 'inputPorts'
  } else if (_.has(curNode.outputPorts, port)) {
    return 'outputPorts'
  }
  throw new Error('The node ' + node + ' does not have a port with the name ' + port)
}

/**
 * Returns whether the edge is a continuation link or not
 * @param {Graphlib} graph The graph.
 * @param {edge} edge The edge to test.
 * @return True if the edge is a continuation link, false otherwise.
 */
export function isContinuation (graph, edge) {
  return graph.edge(edge) && graph.edge(edge).continuation
}
