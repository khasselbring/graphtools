
import { find, curry, merge, map, flatten, compact, groupBy, toPairs } from 'lodash/fp'
import * as Port from '../port'
import * as Node from '../node'
import * as Edge from '../edge'
import { flowCallback } from './flow'
import { assertGraph } from '../assert'
import { equal, isRoot } from '../compoundPath'
import { node, port, hasPort, hasNode, nodesDeep, parent, replaceNode } from './node'
import * as changeSet from '../changeSet'
import { location, identifies as locIdentifies, Location } from '../location'
import { incidents } from './connections'
import { Portgraph } from './graph'
import { GraphAction } from './graphaction'

/**
 * Returns a list of edges in the graph. Each edge also has an extra field identifying the parent
 * node to which the edge belongs in the hierarchy.
 * @example <caption>Getting all the edges in a graph</caption>
 * edgesDeep(graph) // -> [{from: ..., to: ..., layer: ..., parent: '#...'}, ...]
 * @param {PortGraph} graph The graph.
 * @returns {Edges[]} A list of edges.
 */
export function edgesDeep(graph: Node.Node): Edge.Edge[] {
  return compact(flatten(map((parent) => (parent.edges || []).map((e) => merge(e, { parent: Node.id(parent) })), nodesDeep(graph))))
    .map((edge) =>
      (edge.layer === 'dataflow' && hasPort(edge.from, graph))
        ? Edge.setType(Port.type(port(edge.from, graph)), edge)
        : edge)
}

/**
 * Returns a list of edges in the graph layer. Each edge also has an extra field identifying the parent
 * node to which the edge belongs in the hierarchy. This function will not recurse into compounds, use edgesDeep for that.
 * @example <caption>Getting the edges in a graph</caption>
 * edges(graph) // -> [{from: ..., to: ..., layer: ..., parent: '#...'}, ...]
 * @param {PortGraph} graph The graph.
 * @returns {Edges[]} A list of edges.
 */
export function edges(graph: Portgraph) {
  return ((<Node.Compound>graph).edges || [])
    .map((edge) =>
      (edge.layer === 'dataflow' && hasPort(edge.from as Port.Port, graph))
        ? Edge.setType(Port.type(port(edge.from as Port.Port, graph)), edge)
        : edge)
}

export function checkEdge(graph: Node.Node, edge: Edge.Edge) {
  var from = node(edge.from, graph)
  var to = node(edge.to, graph)
  // TODO: check for edge/ from parent node is not correct anymore.. normEdge.from is a port object. (Same holds for normEdge.to)
  if (edge.layer === 'dataflow') {
    const dEdge = edge as Edge.DataflowEdge
    if (dEdge.from.node !== '' && !hasNode(dEdge.from, graph)) {
      throw new Error('Cannot create edge connection from not existing node: ' + Port.toString(dEdge.from) + ' to: ' + Port.toString(dEdge.to))
    } else if (dEdge.to.node !== '' && !hasNode(dEdge.to, graph)) {
      throw new Error('Cannot create edge connection from: ' + Port.toString(dEdge.from) + ' to not existing node: ' + Port.toString(dEdge.to))
    }
    if (typeof (edge.from) === 'string' || typeof (edge.to) === 'string') {
      throw new Error('A normalized edge is expected. No short-fort edges are allowed: ' + JSON.stringify(edge))
    } else if (Port.equal(dEdge.from, dEdge.to)) {
      throw new Error('Cannot add loops to the port graph from=to=' + Port.toString(dEdge.from))
    } else if (!Node.isReference(from) && !Node.hasPort(dEdge.from, from)) {
      throw new Error('The source node "' + Port.node(dEdge.from) + '" does not have the outgoing port "' + Port.portName(dEdge.from) + '".')
    } else if (!Node.isReference(to) && !Node.hasPort(dEdge.to, to)) {
      throw new Error('The target node "' + Port.node(dEdge.to) + '" does not have the ingoing port "' + Port.portName(dEdge.to) + '".')
    } else if (!Node.isReference(from) && (Node.port(dEdge.from, from).kind !== ((edge.innerCompoundOutput) ? 'input' : 'output'))) {
      throw new Error('The source port "' + Port.portName(dEdge.from) + '" = "' + JSON.stringify(Node.port(dEdge.from, from)) + '" must be ' +
        ((dEdge.innerCompoundOutput)
          ? 'an inner input port of the compound node ' + edgeParent(dEdge, graph)
          : 'an input port') + ' for the edge: ' + JSON.stringify(dEdge))
    } else if (!Node.isReference(to) && (Node.port(dEdge.to, to).kind !== ((edge.innerCompoundInput) ? 'output' : 'input'))) {
      throw new Error('The target port "' + Port.portName(dEdge.to) + '" = "' + JSON.stringify(Node.port(dEdge.to, to)) + ' must be ' +
        ((dEdge.innerCompoundInput)
          ? 'an inner output port of the compound node ' + dEdge.parent
          : 'an input port') + ' for the edge: ' + JSON.stringify(dEdge))
    }
  } else if (!edge.layer) {
    throw new Error('Edge must have a layer attribute: ' + JSON.stringify(edge))
  }
}

function pathsToIDs(edge: Edge.Edge, graph: Node.Node) {
  if ((<any>edge).query) return edge
  var from = node(edge.from, graph)
  var to = node(edge.to, graph)
  if (edge.layer === 'dataflow') {
    return merge(edge, {
      from: { node: Node.id(from) },
      to: { node: Node.id(to) }
    }) as Edge.Edge
  } else {
    return merge(edge, { from: Node.id(from), to: Node.id(to) }) as Edge.Edge
  }
}

function edgeParent(edge: Edge.Edge, graph: Node.Node) {
  var parentFrom = Node.path(parent(edge.from, graph))
  var parentTo = Node.path(parent(edge.to, graph))
  if (equal(parentFrom, parentTo)) {
    return parentFrom // = parentTo
  } else if (equal(Node.path(node(edge.from, graph)), parentTo)) {
    return parentTo
  } else if (equal(Node.path(node(edge.to, graph)), parentFrom)) {
    return parentFrom
  } else {
    if (edge.layer !== 'dataflow') {
      // TODO is there any sensible parent for an arbitrary edge?
      return parentFrom
    }
    throw new Error('Unable to determine parent for the edge:' + JSON.stringify(edge))
  }
}

function setInnerCompound(edge: Edge.Edge, graph: Node.Node): Edge.Edge {
  if (edge.layer !== 'dataflow') return edge
  var parentFrom = Node.path(parent(edge.from, graph))
  var parentTo = Node.path(parent(edge.to, graph))
  var from = Node.path(node(edge.from, graph))
  var to = Node.path(node(edge.to, graph))
  if (equal(from, to) && equal(parentFrom, parentTo)) {
    return merge(edge, { innerCompoundInput: true, innerCompoundOutput: true })
  } else if (equal(from, parentTo)) {
    return merge(edge, { innerCompoundOutput: true })
  } else if (equal(to, parentFrom)) {
    return merge(edge, { innerCompoundInput: true })
  } else if (equal(parentFrom, parentTo)) {
    return edge
  } else {
    throw new Error('Unable to determine parent for the edge:' + JSON.stringify(edge))
  }
}

function unIDPort(port: Port.Port, inner: boolean, graph: Node.Node): Port.Port {
  var fromNode = node(port, graph)
  if (!Number.isNaN(parseInt(Port.portName(port)))) {
    if (Node.ports(fromNode).length === 0 && Node.isReference(fromNode)) return port
    var portId = parseInt(Port.portName(port))
    var ports = Node[inner ? 'inputPorts' : 'outputPorts'](fromNode, true)
    if (portId >= ports.length) {
      throw new Error('Node does not have a ' + portId + '-th port.')
    }
    return merge(port, { port: Port.portName(ports[portId]) })
  }
  return port
}

function unIDPorts(edge: Edge.DataflowEdge, graph: Node.Node): Edge.DataflowEdge {
  return merge(edge, {
    from: unIDPort(edge.from, edge.innerCompoundOutput, graph),
    to: unIDPort(edge.to, !edge.innerCompoundInput, graph)
  })
}

function normalize(edge: Edge.Edge, graph: Node.Node) {
  var normEdge = Edge.normalize(edge)
  if (edge.layer === 'dataflow') {
    return unIDPorts(setInnerCompound(pathsToIDs(normEdge, graph), graph) as Edge.DataflowEdge, graph)
  } else {
    return normEdge
  }
}

function addEdgeToCompound(edge: Edge.Edge, graph: Node.Node): Node.Node {
  var cs = changeSet.insertEdge(edge)
  var parent = edgeParent(edge, graph)
  if (isRoot(parent) || equal(parent, graph.path)) {
    return changeSet.applyChangeSet(graph, cs)
  } else {
    var comp = node(parent, graph)
    var newComp = changeSet.applyChangeSet(comp, cs)
    return replaceNode(parent, newComp)(graph)
  }
}

/**
 * @description Add an edge to the graph.
 * @param {Edge} edge The edge that should be added. This needn't be in standard format.
 * @returns {GraphAction} The graph action that adds the edge to the graph
 * @throws {Error} If:
 *  - the edge already exists
 *  - ports that the edge connects do not exists
 *  - nodes that the edge connects do not exists
 *  - the edge is not in normalizable form.
 */
export function addEdge(edge: Edge.Edge) {
  return ((graph, ...cbs) => {
    const cb = flowCallback(cbs)
    assertGraph(graph, 2, 'addEdge')
    if (hasEdge(edge, graph)) {
      throw new Error('Cannot create already existing edge: ' + JSON.stringify(edge))
    }
    var normEdge = normalize(edge, graph)
    checkEdge(graph, normEdge)
    return cb(normEdge, addEdgeToCompound(normEdge, graph))
  }) as GraphAction
}

/**
 * @description Remove an edge in the graph
 * @param {Edge} edge The edge that should be removed. This needn't be in standard format.
 * @returns {GraphAction} The graph action that ultimately removes the edge.
 * @throws {Error} If there is no such edge in the graph.
 */
export function removeEdge(edge: Edge.Edge) {
  return ((graph, ...cbs) => {
    const cb = flowCallback(cbs)
    assertGraph(graph, 2, 'removeEdge')
    var normEdge = normalize(edge, graph)
    if (!hasEdge(normEdge, graph)) {
      throw new Error('Cannot delete edge that is not in the graph.')
    }
    var parent = edgeParent(edge, graph)
    const cs = changeSet.removeEdge(normEdge)
    if (isRoot(parent) || equal(parent, graph.path)) {
      return cb(normEdge, changeSet.applyChangeSet(graph, cs))
    } else {
      var comp = node(parent, graph)
      var newComp = changeSet.applyChangeSet(comp, cs)
      return cb(normEdge, replaceNode(parent, newComp)(graph))
    }
  }) as GraphAction
}

function identifies(edge: Edge.Edge, graph: Node.Node) {
  assertGraph(graph, 2, 'identifies')
  if (!(<any>edge).query) return (other: Edge.Edge) => Edge.equal(edge, other)
  var fromLoc = location(edge.from, graph)
  var toLoc = location(edge.to, graph)
  return (cmpEdge) => locIdentifies(fromLoc)(node(cmpEdge.from, graph)) &&
    (!(<any>fromLoc).port || (<any>fromLoc).port === cmpEdge.from.port) &&
    locIdentifies(toLoc)(node(cmpEdge.to, graph)) &&
    (!(<any>toLoc).port || (<any>toLoc).port === cmpEdge.to.port)
}

function findEdge(edge: Edge.Edge, graph: Node.Node): Edge.Edge {
  try { // TODO: improve error message when an error is thrown
    var normEdge = normalize(edge, graph)
    return find(identifies(normEdge, graph), edgesDeep(graph))
  } catch (err) {
    return null
  }
}

/**
 * @description Checks whether the graph has the given edge.
 * @params {Edge} edge The edge to look for. This needn't be in standard format.
 * @params {PortGraph} graph The graph.
 * @returns {boolean} True if the edge is contained in the graph, false otherwise.
 */
export function hasEdge(edge: Edge.Edge, graph: Node.Node) {
  assertGraph(graph, 2, 'hasEdge')
  return !!findEdge(edge, graph)
}

/**
 * @description Returns the queried edge. This needn't be in standard format.
 * @params {Edge} edge A edge mock that only contains the connecting ports but not necessarily further information.
 * @params {PortGraph} graph The graph.
 * @returns {Edge} The edge as it is stored in the graph.
 * @throws {Error} If the edge is not contained in the graph.
 */
export function edge(edge: Edge.Edge, graph: Portgraph) {
  assertGraph(graph, 2, 'edge')
  var retEdge = findEdge(edge, graph)
  if (!retEdge) {
    throw new Error('Edge is not defined in the graph: ' + JSON.stringify(edge))
  }
  return retEdge
}

function realizePort(node: Node.Node, type: string, port: Port.Port): Port.Port {
  if (Node.equal(Port.node(port), node)) {
    const pName = Port.portName(port)
    if (pName === parseInt(pName).toString()) {
      return Node[type + 'Port'](parseInt(pName), node)
    }
  }
}

function inputType(edge: Edge.Edge, port: string) {
  if (port === 'from' && !edge.innerCompoundOutput) return 'output'
  if (port === 'from' && edge.innerCompoundOutput) return 'input'
  if (port === 'to' && !edge.innerCompoundInput) return 'input'
  if (port === 'to' && edge.innerCompoundInput) return 'output'
}

function realizeEdge(edge: Edge.Edge, node: Node.Node) {
  if (edge.layer === 'dataflow') {
    const dEdge = edge as Edge.DataflowEdge
    return {
      from: realizePort(node, inputType(dEdge, 'from'), dEdge.from),
      to: realizePort(node, inputType(dEdge, 'to'), dEdge.to)
    }
  } else {
    return edge
  }
}

/**
 * @description This goes through all edges that are connected to the given node and
 * realizes them, if a node reference was replaced by an actual node. If it was replaced by another
 * reference nothing will happen.
 * @example <caption>Where it is used, when modifying graphs.</caption>
 * var graph = Graph.flow(
 *   Graph.addNode({ref: 'a', name: 'a', ports: []}),
 *   Graph.addNode({ref: 'b', name: 'b', ports: []}),
 *   Graph.addEdge({from: 'a@0', to: 'b@0'}),
 *   // the following command will call realizeEdgesForNode
 *   // it will replace the 0-th port in the edge with the 'outA' port.
 *   Graph.replaceNode('a', {componentId: 'a', ports: [{port: 'outA', kind: 'input', type: 'generic'}]})
 *   // the following command will call realizeEdgesForNode
 *   // it will replace the 0-th port in the edge with the 'outA' port.
 *   Graph.replaceNode('b', {componentId: 'b', ports: [{port: 'inB', kind: 'input', type: 'generic'}]})
 * )()
 * // after this the graph will have an edge {from: 'a@outA', to: 'b@inB'} and not {from: 'a@0', to: 'b@0'} anymore.
 * @param {Location} loc A location identifier for the node whose edges should be updated.
 * @param {Portgraph} graph The graph to perform the operation on
 * @returns {Portgraph} A new graph in which the edges for the given node are realized (if possible).
 */
export function realizeEdgesForNode(loc: Location, graph: Portgraph) {
  assertGraph(graph, 2, 'realizeEdgesForNode')
  const nodeElem = node(loc, graph)
  if (Node.isReference(nodeElem)) return graph
  const edges = incidents(loc, graph)
  const cs = edges.map((e) => [e.parent, changeSet.updateEdge(e, realizeEdge(e, nodeElem))])
  return toPairs(groupBy((a) => a[0], cs))
    .map((v) => [v[0], v[1].map((i) => i[1])])
    .reduce((gr, c) => replaceNode(c[0], changeSet.applyChangeSets(node(c[0], gr) as Portgraph, c[1]))(gr), graph)
}
