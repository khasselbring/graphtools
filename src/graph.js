import _ from 'lodash'
import {packageVersion} from './internals'
import * as changeSet from './changeSet'
import * as Node from './node'
import * as Component from './component'
import * as Compound from './compound'
import * as Edge from './edge'
import * as ObjectAPI from './objectAPI'
import omitDeep from 'omit-deep-lodash'
import debugLog from 'debug'

const debug = debugLog('graphtools')
var apiMethods = _.omit(module.exports, 'empty')
const addAPI = _.partial(ObjectAPI.addObjectAPI, _, apiMethods)
const remAPI = _.partial(ObjectAPI.removeObjectAPI, _, apiMethods)

/**
 * Compares two graphs for structural equality.
 * @param {Graphlib} graph1 One of the graphs to compare.
 * @param {Graphlib} graph2 The other the graph to compare.
 * @returns {boolean} True if both graphs are structually equal, false otherwise.
 */
export function equal (graph1, graph2) {
  return _.isEqual(graph1, graph2)
}

/**
 * Creates a new graph that has the exact same nodes and edges.
 * @param {PortGraph} graph The graph to clone
 * @returns {PortGraph} A clone of the input graph.
 */
export function clone (graph) {
  return fromJSON(toJSON(graph))
}

/**
 * Adds the API to the JSON document to work with the graph.
 * @param {object} jsonGraph The json representing the port graph.
 * @returns {PortGraph} The port graph with its functions.
 */
export function fromJSON (jsonGraph) {
  var nodes = _.concat(jsonGraph.Nodes || [], (Array.isArray(jsonGraph.nodes)) ? jsonGraph.nodes : [])
  var edges = _.concat(jsonGraph.Edges || [], (Array.isArray(jsonGraph.edges)) ? jsonGraph.edges : [])
  var components = _.concat(jsonGraph.Components || [], (Array.isArray(jsonGraph.components)) ? jsonGraph.components : [])
  jsonGraph.Nodes = nodes
  jsonGraph.Edges = edges
  jsonGraph.Components = components
  delete jsonGraph.nodes
  delete jsonGraph.edges
  delete jsonGraph.components
  jsonGraph.Edges = _.map(jsonGraph.Edges, _.partial(Edge.normalize, jsonGraph))
  _.each(jsonGraph.Nodes, _.partial(checkNode, jsonGraph))
  _.each(jsonGraph.Edges, _.partial(checkEdge, jsonGraph))
  _.each(jsonGraph.Components, _.partial(checkComponent, jsonGraph))
  // add parents
  return addAPI(jsonGraph)
}

function subGraphs (graph) {
  return _.flatten(nodes(graph)
    .filter((n) => n.implementation)
    .map((n) => ([{graph, id: n.id, subgraph: n.implementation}, subGraphs(n.implementation)])))
}

function removeGraphInternals (graph) {
  var graphs = subGraphs(graph)
  graphs.forEach((gr) => replaceNode(gr.subgraph, gr.id, omitDeep(node(gr.graph, gr.id), '_internals')))
  return graph
}

/**
 * Returns a JSON object for the graph
 * @param {PortGraph} graph The graph to convert
 * @returns {object} A JSON representation of the graph.
 */
export function toJSON (graph) {
  var exportGraph = removeGraphInternals(graph)
  return remAPI(_.cloneDeep(exportGraph))
}

/**
 * Checks whether the graph allows references to components. This is usally disabled after the graph is resolved.
 * Resolving a graph replaces all references with their components.
 * @params {PortGraph} graph The graph
 * @returns {boolean} True if the graph allows references, false otherwise.
 */
export function allowsReferences (graph) {
  return !graph.blockReferences
}

/**
 * Stops references from being inserted into the graph. After references are disallowed they cannot and should not be reallowed.
 * @params {PortGraph} graph The graph.
 * @returns {PortGraph} The graph given as an argument where references are now disallowed.
 * @throws {Error} If the graph has references it throws an error. Only graphs without references can disallow them.
 */
export function disallowReferences (graph) {
  if (_.filter(graph.Nodes, Node.isReference).length !== 0) {
    throw new Error('Graph still contains referencens. Impossible to disallow references.')
  }
  return _.set(graph, 'blockReferences', true)
}

/**
 * Sets the implementation of a node defined in a compound node to a new implementation.
 * @param {Compound} comp The compound node that should be changed.
 * @param {string|String[]} idOrPath The id of the node in the graph or a path object.
 * @param {Node} newNode The new node that updates the node with the given id.
 * @reutrns {Compound} The compound node with the updated node.
 */
export function replaceReference (graph, idOrPath, newNode) {
  var idx = _.findIndex(graph.Nodes, (n) => equal(idOrPath, n))
  return _.set(graph, 'Nodes[' + idx + ']', newNode)
}

/**
 * Returns a list of nodes on the root level.
 * @param {PortGraph} graph The graph.
 * @param {function} [predicate] An optional function that filters nodes. If no predicate function is given, all nodes are returned.
 * @returns {Nodes[]} A list of nodes.
 */
export function nodes (graph, predicate) {
  if (predicate) {
    return _.filter(graph.Nodes, predicate) || []
  }
  return graph.Nodes || []
}

function nodesDeepRec (graph, parents, cPath) {
  return _.flatten(parents.map((p) => nodesDeep(p, cPath.concat([p.id]))))
}

/**
 * Get all nodes at all depths. It will go into every compound node and return their nodes
 * and the nodes of their compound nodes, etc.
 * @param {PortGraph} graph The graph to work on
 * @param {String[]} baseCPath The base compound path for the node paths. This path specifies a list of parents and the actual node.
 * @returns {Pair<Compound Path, Node>[]} A list of pairs. Each containing a compound path as the first element specifying a list of parents
 * that lead to the node in the graph. The second element is the corresponding node.
 */
export function nodesDeep (graph, baseCPath = []) {
  return nodes(graph)
    .map((node) => [baseCPath.concat([node.id]), node])
    .concat(nodesDeepRec(graph, nodes(graph, Compound.isCompound), baseCPath))
}

/**
 * Returns a list of node names. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of node names.
 */
export function nodeNames (graph) {
  return _.map(graph.Nodes, Node.id)
}

/**
 * Returns the node given by the compound path.
 * @param {PortGraph} graph The graph.
 * @param {String[]} path A compound path specifying the node in the graph.
 * @returns {Node} The node in the graph
 * @throws {Error} If the compound path is invalid.
 */
export function nodeByPath (graph, path, basePath) {
  if (typeof (path) === 'string' && Node.isCompoundPath(path)) {
    path = Node.stringToPath(path)
  } else if (!Array.isArray(path)) {
    throw new Error('Invalid argument for `nodeByPath`. An compound path (array of node ids) is required.')
  }
  basePath = basePath || path
  var curNode = node(graph, path[0])
  if (path.length > 1) {
    if (!Compound.isCompound(curNode)) {
      throw new Error('Expected "' + path[0] + '" to be a compound node in: ' + basePath)
    }
    return nodeByPath(curNode, path.slice(1), basePath)
  } else {
    return curNode
  }
}

/**
 * Returns the node with the given id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Node|string} node The node or its id.
 * @returns {Node} The node in the graph
 * @throws {Error} If the queried node does not exist in the graph.
 */
export function node (graph, node) {
  if (Compound.isCompound(graph) && Compound.id(graph) && Node.equal(graph, node)) {
    return graph
  }
  if (Array.isArray(node) || Node.isCompoundPath(node)) {
    return nodeByPath(graph, node)
  }
  var res = _.find(graph.Nodes, (n) => Node.equal(n, node))
  if (!res) {
    debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    throw new Error(`Node with id '${Node.id(node)}' does not exist in the graph.`)
  }
  return res
}

/**
 * Gets a list of all reference nodes.
 * @param {PortGraph} graph The graph.
 * @returns {References[]} A list of all defined reference nodes in the graph.
 */
export function references (graph) {
  return nodes(graph, Node.isReference)
}

/**
 * Gets a list of all compound nodes.
 * @param {PortGraph} graph The graph.
 * @returns {References[]} A list of all defined compound nodes in the graph.
 */
export function compounds (graph) {
  return nodes(graph, Node.isCompound)
}

/**
 * Create a new compound node. Each compound node is itself a graph that can contain further nodes.
 * @param {Node} node The node that should be converted into a compound node.
 * @returns {PortGraph} The graph representing the compound node.
 */
export function compound (node) {
  return addAPI(_.merge({}, node, emptyGraph(), {atomic: false}))
}

/**
 * Gets a list of all atomic nodes.
 * @param {PortGraph} graph The graph.
 * @returns {References[]} A list of all defined atomci nodes in the graph.
 */
export function atomics (graph) {
  return nodes(graph, Node.isAtomic)
}

export function hasNodeByPath (graph, path, basePath) {
  if (typeof (path) === 'string' && Node.isCompoundPath(path)) {
    path = Node.stringToPath(path)
  } else if (!Array.isArray(path)) {
    throw new Error('Invalid argument for `nodeByPath`. An compound path (array of node ids) is required.')
  }
  basePath = basePath || path
  const nodeExists = hasNode(graph, path[0])
  if (path.length > 1 && nodeExists) {
    var curNode = node(graph, path[0])
    if (!Compound.isCompound(curNode)) {
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

/**
 * Checks whether the graph has a node with the given id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Node|string} node The node or its id you want to check for.
 * @returns {boolean} True if the graph has a node with the given id, false otherwise.
 */
export function hasNode (graph, node) {
  if (Array.isArray(node) || Node.isCompoundPath(node)) {
    return hasNodeByPath(graph, node)
  }
  return !!_.find(graph.Nodes, (n) => Node.equal(n, node))
}

function checkNode (graph, node) {
  if (allowsReferences(graph) && Node.isReference(node)) {
    return
  }
  if (!node) {
    throw new Error('Cannot add undefined node to graph.')
  } else if (!Node.isValid(node)) {
    throw new Error('Cannot add invalid node to graph. Are you missing the id or a port?\nNode: ' + JSON.stringify(node))
  }
}

/**
 * Add a node at a specific path.
 * @param {PortGraph} graph The graph that is the root for the nodePath
 * @param {CompoundPath} parentPath A compound path identifying the location in the compound graph.
 * @param {Node} node The node to add to the graph.
 * @returns {PortGraph} A new graph that contains the node at the specific path.
 */
export function addNodeByPath (graph, parentPath, nodeData) {
  if (Node.isRootPath(parentPath)) {
    return addNode(graph, nodeData)
  } else {
    var parentGraph = node(parentPath)
    return replaceNode(graph, parentPath, addNode(parentGraph, nodeData))
  }
}

/**
 * Gets the compound path for a node or compound node.
 * @param {Node|PortGraph} node The node
 * @returns {Path} A compound path to the node, from the root element.
 */
export function compoundPath (node) {
  return node.path
}

/**
 * Add a node to the graph, returns a new graph. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {CompoundPath} [nodePath] The path of the parent node. Optional, if you want to add it to the root element you can omit the path.
 * @param {Node} node The node object that should be added.
 * @returns {PortGraph} A new graph that includes the node.
 */
export function addNode (graph, nodePath, node) {
  if (Node.isCompoundPath(nodePath) && Node.isValid(node)) {
    addNodeByPath(graph, nodePath, node)
  }
  node = nodePath
  if (hasNode(graph, node)) {
    throw new Error('Cannot add already existing node: ' + Node.id(node))
  }
  checkNode(graph, node)
  return addAPI(changeSet.applyChangeSet(graph, changeSet.insertNode(toJSON(node), {path: Node.pathJoin(compoundPath(graph), Node.id(node))})))
}

/**
 * Removes a node from the graph. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {CompoundPath} path The node that shall be removed, either the node object or the id.
 * @returns {PortGraph} A new graph without the given node.
 */
export function removeNode (graph, path) {
  var parentPath = Node.pathParent(path)
  if (parentPath.length === 0) {
    return addAPI(changeSet.applyChangeSet(graph, changeSet.removeNode(path)))
  }
  var parentGraph = node(graph, parentPath)
  // remove node in its compound and replace the graphs on the path
  return replaceNode(graph, parentPath, removeNode(parentGraph, Node.pathNode(path)))
}

export function replaceNode (graph, path, newNode) {
  return addNodeByPath(removeNode(graph, path), Node.pathParent(path), _.merge({id: Node.pathNode(path)}, newNode))
}

/**
 * Returns a list of defined components. Components are not part of the program flow, but are defined
 * procedures that can be used in the resolve process.
 * @param {PortGraph} graph The graph.
 * @retuns {Components[]} A list of components that are defined in the graph.
 */
export function components (graph) {
  return graph.Components
}

/**
 * Returns a list of component ids. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of component ids.
 */
export function componentIds (graph) {
  return _.map(graph.Components, Component.componentId)
}

/**
 * Returns the component with the given component id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Component|string} comp The component or its component id.
 * @returns {Component} The component in the graph
 * @throws {Error} If the queried component does not exist in the graph.
 */
export function component (graph, comp) {
  var res = _.find(graph.Components, (n) => Component.equal(n, comp))
  if (!res) {
    debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    throw new Error(`Component with id '${comp}' does not exist in the graph.`)
  }
  return res
}

/**
 * Checks whether the graph has a component with the given component id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Component|string} comp The component or its component id you want to check for.
 * @returns {boolean} True if the graph has a component with the given component id, false otherwise.
 */
export function hasComponent (graph, comp) {
  return !!_.find(graph.Components, (n) => Component.equal(n, comp))
}

function checkComponent (graph, comp) {
  if (!comp) {
    throw new Error('Cannot add undefined component to graph.')
  } else if (!Component.isValid(comp)) {
    throw new Error('Cannot add invalid component to graph. Are you missing the component-id, the version or a port?\nComponent: ' + JSON.stringify(comp))
  }
}

/**
 * Add a component to the graph. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {Component} comp The component object that should be added.
 * @returns {PortGraph} A new graph that includes the component.
 */
export function addComponent (graph, comp) {
  if (hasComponent(graph, comp)) {
    throw new Error('Cannot add already existing component: ' + Component.id(comp))
  }
  checkComponent(graph, comp)
  return addAPI(changeSet.applyChangeSet(graph, changeSet.insertComponent(comp)))
}

/**
 * Removes a component from the graph. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {Component|string} comp The component that shall be removed, either the component object or the component id.
 * @returns {PortGraph} A new graph without the given component.
 */
export function removeComponent (graph, comp) {
  return addAPI(changeSet.applyChangeSet(graph, changeSet.removeComponent(Component.id(comp))))
}

/**
 * Returns a list of edges in the graph.
 * @param {PortGraph} graph The graph.
 * @returns {Edges[]} A list of edges.
 */
export function edges (graph) {
  return graph.Edges
}

function checkEdge (graph, edge, parent) {
  var normEdge = Edge.normalize(graph, edge, parent)
  var from = node(graph, normEdge.from)
  var to = node(graph, normEdge.to)
  if (Compound.id(graph) !== normEdge.from && !hasNode(graph, normEdge.from)) {
    throw new Error('Cannot create edge connection from not existing node: ' + normEdge.from + ' to: ' + normEdge.to)
  } else if (Compound.id(graph) !== normEdge.to && !hasNode(graph, normEdge.to)) {
    throw new Error('Cannot create edge connection from: ' + normEdge.from + ' to not existing node: ' + normEdge.to)
  } else if (normEdge.from === normEdge.to && normEdge.outPort === normEdge.inPort) {
    throw new Error('Cannot add loops to the port graph from=to=' + normEdge.from + '@' + normEdge.outPort)
  } else if (!Node.isReference(from) && !Node.hasPort(node(graph, normEdge.from), normEdge.outPort)) {
    throw new Error('The source node "' + normEdge.from + '" does not have the outgoing port "' + normEdge.outPort + '".')
  } else if (!Node.isReference(from) && !Node.hasPort(node(graph, normEdge.to), normEdge.inPort)) {
    throw new Error('The target node "' + normEdge.to + '" does not have the ingoing port "' + normEdge.inPort + '".')
  } else if (!Node.isReference(from) && (Node.port(from, normEdge.outPort).kind !== ((normEdge.innerCompoundOutput) ? 'input' : 'output'))) {
    throw new Error('The source port "' + normEdge.outPort + '" = "' + JSON.stringify(Node.port(from, normEdge.outPort)) + '" must be ' +
    ((normEdge.innerCompoundEdge)
    ? 'an inner input port of the compound node ' + normEdge.parent
    : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
  } else if (!Node.isReference(from) && (Node.port(to, normEdge.inPort).kind !== ((normEdge.innerCompoundInput) ? 'output' : 'input'))) {
    throw new Error('The target port "' + normEdge.inPort + '" = "' + JSON.stringify(Node.port(to, normEdge.inPort)) + ' must be ' +
      ((normEdge.innerCompoundEdge)
      ? 'an inner output port of the compound node ' + normEdge.parent
      : 'an input port') + ' for the edge: ' + JSON.stringify(edge))
  }
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
export function addEdge (graph, edge) {
  if (hasEdge(graph, edge)) {
    throw new Error('Cannot create already existing edge: ' + JSON.stringify(edge))
  }
  var normEdge = Edge.normalize(graph, edge)
  checkEdge(graph, edge)
  return addAPI(changeSet.applyChangeSet(graph, changeSet.insertEdge(normEdge)))
}

/**
 * Checks whether the graph has the given edge.
 * @params {PortGraph} graph The graph.
 * @params {Edge} edge The edge to look for.
 * @returns {boolean} True if the edge is contained in the graph, false otherwise.
 */
export function hasEdge (graph, edge) {
  var normEdge = Edge.normalize(graph, edge)
  return !!_.find(graph.Edges, (e) => Edge.equal(e, normEdge))
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
  var retEdge = _.find(graph.Edges, (e) => Edge.equal(e, normEdge))
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
 * Gets the parent of a node.
 * @param {PortGraph} graph The graph.
 * @param {Node} node The node for which you want to get the parent.
 * @returns {Node} The node id of the parent node or undefined if the node has no parent.
 */
export function parent (graph, n) {
  return node(graph, n).parent
}

/**
 * Checks whether the two nodes are connected via an edge.
 * @param {PortGraph} graph The graph in which we want to find the connection.
 * @param {Node} nodeFrom The starting point of our connection.
 * @param {Node} nodeTo The target of our connection.
 * @returns {boolean} True if the graph has an edge going from "nodeFrom" to "nodeTo".
 */
export function areConnected (graph, nodeFrom, nodeTo) {
  return !!_.find(graph.Edges, (e) => e.from === nodeFrom && e.to === nodeTo)
}

/**
 * Returns the meta information encoded in the graph
 * @param {PortGraph} graph The graph.
 * @returns {object} An object with all meta information keys.
 */
export function meta (graph) {
  return graph.MetaInformation
}

/**
 * Sets the meta information in the graph for the given key to the value
 * @param {PortGraph} graph The graph.
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @returns A new graph with the applied changes.
 */
export function setMeta (graph, key, value) {
  return addAPI(changeSet.applyChangeSet(graph, changeSet.addMetaInformation(key, value)))
}

/**
 * Returns a list of predecessors for a node including the input port. Each node can only have exactly one
 * predecessor for every port.
 * @param {PortGraph} graph The graph.
 * @param {string} node The node for which we look for predecessors.
 * @returns {Port[]} A list of ports with their corresponding nodes
 */
export function predecessors (graph, node) {
  return _(graph.Edges)
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
  return _(graph.Edges)
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
  return _(graph.Edges)
    .filter((e) => e.from === node && (!port || e.outPort === port))
    .map((e) => ({node: e.to, port: e.inPort, preceedingNode: e.from, preceedingPort: e.outPort}))
    .value()
}

function emptyGraph () {
  return {
    Nodes: [],
    MetaInformation: {version: packageVersion()},
    Edges: [],
    Components: []
  }
}

/**
 * Returns a new empty graph.
 * @returns {PortGraph} A new empty port graph.
 */
export function empty () {
  return addAPI(emptyGraph(), apiMethods)
}
