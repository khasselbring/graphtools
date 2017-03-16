/**
 * Rewrite rules for compound nodes.
 */

import curry from 'lodash/fp/curry'
import any from 'lodash/fp/any'
import all from 'lodash/fp/all'
import negate from 'lodash/fp/negate'
import uniq from 'lodash/fp/uniq'
import flatten from 'lodash/fp/flatten'
import keyBy from 'lodash/fp/keyBy'
import reverse from 'lodash/fp/reverse'
import uniqBy from 'lodash/fp/uniqBy'
import {flow, flowCallback} from '../graph/flow'
import * as Compound from '../compound'
import {predecessor, successors, inIncidents, inIncident, outIncidents} from '../graph/connections'
import * as Graph from '../graph'
import * as Node from '../node'
import * as Path from '../compoundPath'
import * as Port from '../port'
import {Edge, DataflowEdge} from '../edge'
import {mergeNodes} from '../graph/internal'
import {node} from '../graph/node'
import {topologicalSort} from '../algorithm/algorithms'
import cuid = require('cuid')
import {GraphAction} from '../graph/graphaction'

/**
 * @function
 * @name includePredecessor
 * @description
 * Moves the predecessor of a port into the compound node. It changes the signature of the
 * compound node. It has to ensure that the inputs are correct. This only works if the predecessor has
 * only one successor (i.e. the compound node it will move into).
 * @param {Port} port A port identifier. This also specifies the node.
 * @param {PortGraph} graph The graph in which the change will happen.
 * @returns {PortGraph} A new port graph that includes the predecessor of the port in the compound.
 * @throws {Error} If the predecessor has more than one successor.
 */
export function includePredecessor (port:Port.Port):GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    var pred = predecessor(port, graph)
    var portNode = Graph.node(port, graph)
    var predNode = Graph.node(pred, graph)
    /* if (outIncidents(pred.node, graph).length > 1 && !successors(pred.node, graph).every((n) => Node.equal(n, portNode))) {
      throw new Error('Cannot include the predecessor of port: ' + JSON.stringify(port) + ' as it has multiple successors.')
    }
    */
    var preInPorts = inIncidents(pred.node, graph)
    var affectedPorts = uniqBy((pair) => pair.compoundPort,
      flatten(Node.outputPorts(predNode).map((p) => successors(p, graph).map((s) => ({predecessorPort: p, compoundPort: s})))))
    var postInPorts = affectedPorts.map((p) => Object.assign(p, {outEdges: outIncidents(p.compoundPort, graph)}))
    var additionalPorts = successors(pred.node, graph).filter((n) => !Node.equal(n, portNode))
    var compound = portNode

    var newCompound = flow(
      Graph.addNodeWithID(predNode),
      // remove old port and add predecessor
      affectedPorts.map((p) => Compound.removePort(p.compoundPort)),
      // set the id of the included predecessor to the id of the predecessor
      // add all input ports of predecessor
      preInPorts.map((edge) => Compound.addInputPort(edge.to)),
      additionalPorts.map((p) => Compound.addOutputPort(p)),
      preInPorts.map((edge) =>
          Graph.addEdge({from: '@' + (edge as DataflowEdge).to.port, to: predNode.id + '@' + (edge as DataflowEdge).to.port} as Edge)),
      postInPorts.map((obj) => Graph.flow(obj.outEdges.map((edge) => Graph.addEdge({from: obj.predecessorPort, to: edge.to} as DataflowEdge)))),
      additionalPorts.map((p) => Graph.addEdge({from: predecessor(p, graph), to: '@' + p.port} as Edge)),
      {name: 'Adding predecessor at port ' + JSON.stringify(Port.portName(port)) + ' to compound.'}
    )(compound)
    var newGraph = flow(
      [
        Graph.removeNode(pred),
        Graph.replaceNode(port, newCompound)
      ]
      .concat(preInPorts.map((edge) =>
          Graph.addEdge({from: edge.from, to: compound.id + '@' + (<DataflowEdge>edge).to.port} as Edge)))
      .concat(additionalPorts.map((p) =>
          Graph.addEdge({from: newCompound.id + '@' + p.port, to: p} as Edge))),
      {name: '[includePredecessor] Replacing compound node with new compound.'}
    )(graph)
    return cb(node(predNode, newGraph) , newGraph)
  }
}

/**
 * @description
 * Moves a node from its compound to the parent compound node. Changes the compound node to
 * ensure it takes the correct number of inputs etc. This method only works if the node has no
 * predecessor in the compound node.
 * @param {Node} node A node identifier for the node that should be moved out of the compound node.
 * @param {PortGraph} graph The graph
 * @returns {PortGraph} A new graph in which the node is moved out of its parent compound into the parent
 * of its parent.
 * @throws {Error} If the node has a predecessor in the compound and thus cannot be moved out of the
 * compound node.
 */
export function excludeNode (eNode:Node.Node):GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    var nodeObj = Graph.node(eNode, graph)
    var parent = Graph.parent(eNode, graph)
    var preds = inIncidents(eNode, graph)
    if (any((n) => !Node.equal(parent, n)), preds.map((edge) => (<DataflowEdge>edge).from.node)) {
      throw new Error('Node has predecessor in the parent compound and thus cannot be moved out of the compound node.')
    }
    // ports that only lead to the node that should be excluded
    var exclusivePorts = uniq(preds
      .filter((edge) => all((n) => Node.equal(nodeObj, n), successors(edge.from, graph)))
      .map((edge) => edge.from))
    var portPreds = preds.map((edge) => [inIncident(edge.from, graph), edge])
    var succs = outIncidents(eNode, graph)

    var newCompound = flow(
      // remove the node inside the compound
      Graph.removeNode(nodeObj),
      // remove all ports that are not needed inside the compound anymore
      exclusivePorts.map((p) => Compound.removePort(p)),
      // add all a port for each output port of the excluded node
      Node.outputPorts(nodeObj, true).map((port) => Compound.addInputPort(port)),
      // add all outgoing edges from the newly created compound ports to their successors
      succs.map((edge) => Graph.addEdge({from: '@' + (<DataflowEdge>edge).from.port, to: edge.to} as Edge))
    )(parent)
    var newGraph = flow(
      // disconnect all edges whose ports get removed
      flow(portPreds.map((edges) => Graph.removeEdge(edges[0]))),
      Graph.replaceNode(parent, newCompound),
      Graph.Let(Graph.addNodeIn(Graph.parent(parent, graph), nodeObj), (node, graph) =>
        mergeNodes({id: nodeObj.id}, node, graph)),
      portPreds.map((edges) => Graph.addEdge({from: edges[0].from, to: nodeObj.id + '@' + (<DataflowEdge>edges[1]).to.port} as Edge)),
      Node.outputPorts(nodeObj, true).map((port) => Graph.addEdge({from: nodeObj.id + '@' + port.port, to: parent.id + '@' + port.port} as Edge))
    )(graph)
    return cb(node(eNode, newGraph) ,newGraph)
  }
}

/**
 * @description
 * Takes a compound node and moves all nodes out of the compound node and removes then removes the empty compound.
 * @param {Compound} node The compound node
 * @param {PortGraph} graph The graph in which the compound node lies.
 * @returns {PortGraph} The new graph where all nodes were moved out of the compound node.
 */
export function unCompound (node:Node.Node):GraphAction {
  return (graph, ...cbs) => {
    var sorting = topologicalSort(Graph.node(node, graph))
    var emptyComp = flow(sorting.map((n) => excludeNode(n)))(graph)
    var cons = flatten(Node.outputPorts(Graph.node(node, emptyComp), true).map((p) =>
      Graph.successors(p, emptyComp).map((to) => ({
        from: Graph.predecessor(Graph.predecessor(p, emptyComp), emptyComp),
        to: to
      }))))
    return flow(
      Graph.removeNode(node),
      cons.map((edge) => Graph.addEdge(edge))
    )(emptyComp)
  }
}

function sameParent (node1:Node.Node, node2:Node.Node) {
  return Path.equal(Path.parent(Node.path(node1)), Path.parent(Node.path(node2)))
}

const sameParents = Graph.sameParents

/**
 * Find alls critical nodes for compoundify. The critical nodes are those, that are in the
 * topological between the first node of the subset and the last node of the subset and not part
 * of the subset. Those nodes can have a successor and a predecessor in the subset and thus making
 * it impossible to compoundify the subset. If we have the following topological sorting and subset
 *
 *   topo:    a  b  c  d
 *   subset:  x  x     x
 *
 * The node `c` would be a critical node as it can have the predecessor b (or a) and successor d.
 */
function criticalNodes (nodes:Node.Node[], topo:Node.Node[], graph:Node.Node) {
  const firstIdx = topo.findIndex((t) => nodes.some((n) => Node.equal(t, n)))
  const lastIdx = topo.length - reverse(topo).findIndex((t) => nodes.some((n) => Node.equal(t, n))) - 1
  const markings = keyBy('id', nodes)
  return topo.slice(firstIdx, lastIdx + 1).filter((elem) => !markings[elem.id])
}

type NoP = Node.Node | Port.Port

function findInSubset (nodeOrPort:NoP, subset:Node.Node[], iterate:(n:Node.Node, g:Node.Node) => (NoP)[], graph:Node.Node) {
  const node = Graph.node(nodeOrPort, graph)
  if (!sameParent(node, subset[0])) return false
  if (subset.find((n) => Node.equal(node, n))) return true
  return iterate(node, graph).some((n) => findInSubset(n, subset, iterate, graph))
}

function successorInSubset (node:Node.Node, subset:Node.Node[], graph:Node.Node) {
  return findInSubset(node, subset, Graph.successors, graph)
}

function predecessorInSubset (node:Node.Node, subset:Node.Node[], graph:Node.Node) {
  return findInSubset(node, subset, Graph.predecessors, graph)
}

/**
 * Checks whether a node is blocked inside a subset or not. A node is blocked by a subset
 * when it as at least one predecessor that is part of the subset and at least one successor
 * that is part of the subset. In the following example, b is blocked as a is a predecessor
 * and b is a successor and thus it is not possible to compoundify a and c.
 *
 * +------------------+
 * |Compound          |
 * |        +---+     |
 * |        | a |     |
 * |        +-+-+     |
 * |          |       |
 * |     +------------+
 * |     |    |
 * |     |  +-v-+
 * |     |  | b |
 * |     |  +-+-+
 * |     |    |
 * |     +------------+
 * |          |       |
 * |        +-v-+     |
 * |        | c |     |
 * |        +---+     |
 * |                  |
 * +------------------+
 *
 */
function blocked (nodes:Node.Node[], graph:Node.Node) {
  return (node) => successorInSubset(node, nodes, graph) && predecessorInSubset(node, nodes, graph)
}

function prefixedPortName (port:Port.Port, prefix:string) {
  return prefix + '→' + port.port
}

function prefixPort (port:Port.Port, prefix:string) {
  return Object.assign(port, {port: prefixedPortName(port, prefix)})
}

function moveIntoCompound (node:Node.Node, cmpd:Node.Node) {
  return (graph) => {
    var newComp = Graph.flow(
      Graph.Let(Graph.addNode(node), (newNode, graph) =>
        mergeNodes({id: node.id}, newNode, graph)),
      Node.inputPorts(node).map((p) => Compound.addInputPort(prefixPort(p, node.id))),
      Graph.flow(Node.inputPorts(node).map((p) => Graph.addEdge({from: '@' + prefixedPortName(p, node.id), to: node.id + '@' + p.port} as Edge))),
      Node.outputPorts(node).map((p) => Compound.addOutputPort(prefixPort(p, node.id))),
      Graph.flow(Node.outputPorts(node).map((p) => Graph.addEdge({from: node.id + '@' + p.port, to: '@' + prefixedPortName(p, node.id)} as Edge)))
    )(Graph.node(cmpd, graph))
    const newInputs = Node.inputPorts(node).map((p) =>
        Graph.flow(Graph.inIncidents(p, graph)
          .map((edge) => Graph.addEdge({from: edge.from, to: cmpd.id + '@' + prefixedPortName((<DataflowEdge>edge).to, node.id)} as Edge))))
    const newOutputs = Node.outputPorts(node).map((p) =>
        Graph.flow(
          Graph.outIncidents(p, graph)
          .map((edge) => Graph.addEdge({from: cmpd.id + '@' + prefixedPortName((<DataflowEdge>edge).from, node.id), to: edge.to} as Edge))))
    return Graph.flow(
      Graph.removeNode(node),
      Graph.replaceNode(cmpd, newComp),
      newInputs,
      newOutputs
    )(graph)
  }
}

function inSubset (subset:Node.Node[]):(n:NoP) => boolean {
  return (node) => !!((node) ? subset.find((n) => Node.equal(node, n)) : false)
}

function moveEndsIntoCompound (subset:Node.Node[], cmpd:Node.Node):GraphAction {
  return (graph) => {
    return Graph.flow(
      subset.filter((n) => Graph.successors(n, graph).every(negate(inSubset(subset))))
      .map((n) => moveIntoCompound(n, cmpd))
    )(graph)
  }
}

function moveSubsetIntoCompound (subset:Node.Node[], cmpd:Node.Node):GraphAction {
  return (graph, ...cbs) => {
    const cb = Graph.flowCallback(cbs)
    var curGraph = moveEndsIntoCompound(subset, cmpd)(graph)
    // as long as not every node of the subset is included in the new graph
    while (!subset.every((n) => !Graph.hasNode(n, curGraph))) {
      const preCompoundNodes = Graph.nodes(Graph.node(cmpd, curGraph)).length
      const activeInputPorts = Node.inputPorts(Graph.node(cmpd, curGraph))
        .filter((p) => inSubset(subset)(Graph.predecessor(p, curGraph)))
      curGraph = Graph.flow(
        uniqBy((p) => Port.node(predecessor(p, curGraph)), activeInputPorts)
          .map((p) => includePredecessor(p))
      )(curGraph)
      const nowCompoundNodes = Graph.nodes(Graph.node(cmpd, curGraph)).length
      // there was nothing to do
      if (nowCompoundNodes === preCompoundNodes) break
    }
    return cb(Graph.node(cmpd, curGraph), curGraph)
  }
}

/**
 * @description
 * Takes a list of nodes and tries to combine them in one compound.
 * @param {Array<Location>} nodes An array of node locations (ids, node objects.. etc.) that should be included in the compound
 * @param {Portgraph} graph The graph
 * @returns {Portgraph} A new graph in which the list of nodes is combined inside one compound.
 * @throws {Error} If it is not possible to combine the nodes in one compound.
*/
export function compoundify (nodes:any[]):GraphAction {
  return (graph, ...cbs) => {
    const cb = Graph.flowCallback(cbs)
    if (nodes.length < 1) return graph
    const nodeObjs = nodes.map((n) => Graph.node(n, graph))
    if (!sameParents(nodeObjs, graph)) {
      throw new Error('Cannot compoundify nodes, the have different parents. (' + JSON.stringify(nodes) + ')')
    }

    const topo = topologicalSort(Graph.parent(nodeObjs[0], graph))
    const critical = criticalNodes(nodeObjs, topo, graph)
    const blockedNodes = critical.filter(blocked(nodeObjs, graph))
    if (blockedNodes.length > 0) {
      throw new Error('Subset of nodes is not compoundably. Nodes [' + blockedNodes.map((c) => c.id).join(', ') + '] are blocked')
    }
    // const parent = Graph.parent(nodeObjs[0], graph)
    const compId = 'compoundify-' + cuid()
    return Graph.flow(
      Graph.Let(Graph.addNode(Graph.compound({componentId: compId})), (newNode, curGraph) =>
        Graph.Let(moveSubsetIntoCompound(nodeObjs, newNode), (upNode, upGraph) =>
          cb(upNode, upGraph))(curGraph))
    )(graph)
  }
}
