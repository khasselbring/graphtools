/**
 * Rewrite rules for compound nodes.
 */

import curry from 'lodash/fp/curry'
import any from 'lodash/fp/any'
import all from 'lodash/fp/all'
import negate from 'lodash/fp/negate'
import flatten from 'lodash/fp/flatten'
import uniq from 'lodash/fp/uniq'
import {flow} from '../graph/flow'
import * as Compound from '../compound'
import {predecessor, successors, inIncidents, outIncidents} from '../graph/connections'
import * as Graph from '../graph'
import * as Node from '../node'
import {mergeNodes} from '../graph/internal'
import {topologicalSort} from '../algorithm'

/**
 * Moves the predecessor of a port into the compound node. It changes the signature of the
 * compound node. It has to ensure that the inputs are correct. This only works if the predecessor has
 * only one successor (i.e. the compound node it will move into).
 * @params {Port} port A port identifier. This also specifies the node.
 * @params {PortGraph} graph The graph in which the change will happen.
 * @returns {PortGraph} A new port graph that includes the predecessor of the port in the compound.
 * @throws {Error} If the predecessor has more than one successor.
 */
export const includePredecessor = curry((port, graph) => {
  var pred = predecessor(port, graph)
  var predNode = Graph.node(pred, graph)
  if (outIncidents(pred.node, graph).length > 1) {
    throw new Error('Cannot include the predecessor of port: ' + JSON.stringify(port) + ' as it has multiple successors.')
  }
  var preInPorts = inIncidents(pred.node, graph)
  var postInPorts = outIncidents(port, graph)
  var compound = Graph.node(port, graph)

  var newCompound = flow(
    // remove old port and add predecessor
    Compound.removePort(port),
    Graph.addNode(predNode),
    // set the id of the included predecessor to the id of the predecessor
    (graph, objs) => mergeNodes({id: predNode.id}, objs()[1], graph),
    // add all input ports of predecessor
    preInPorts.map((edge) => Compound.addInputPort(edge.to)),
    preInPorts.map((edge) =>
        Graph.addEdge({from: '@' + edge.to.port, to: predNode.id + '@' + edge.to.port})),
    postInPorts.map((edge) => Graph.addEdge({from: pred, to: edge.to}))
  )(compound)
  var newGraph = flow(
    [
      Graph.removeNode(pred),
      Graph.replaceNode(port, newCompound)
    ]
    .concat(preInPorts.map((edge) =>
        Graph.addEdge({from: edge.from, to: compound.id + '@' + edge.to.port})))
  )(graph)
  return newGraph
})

/**
 * Moves a node from its compound to the parent compound node. Changes the compound node to
 * ensure it takes the correct number of inputs etc. This method only works if the node has no
 * predecessor in the compound node.
 * @params {Node} node A node identifier for the node that should be moved out of the compound node.
 * @params {PortGraph} graph The graph
 * @returns {PortGraph} A new graph in which the node is moved out of its parent compound into the parent
 * of its parent.
 * @throws {Error} If the node has a predecessor in the compound and thus cannot be moved out of the
 * compound node.
 */
export const excludeNode = curry((node, graph) => {
  var nodeObj = Graph.node(node, graph)
  var parent = Graph.parent(node, graph)
  var preds = inIncidents(node, graph)
  if (any(negate(Node.equal(parent)), preds.map((edge) => edge.from.node))) {
    throw new Error('Node has predecessor in the parent compound and thus cannot be moved out of the compound node.')
  }
  // ports that only lead to the node that should be excluded
  var exclusivePorts = uniq(preds
    .filter((edge) => all(Node.equal(nodeObj), successors(edge.from, graph)))
    .map((edge) => edge.from))
  var portPreds = flatten(preds.map((edge) => inIncidents(edge.from, graph).map((e) => [e, edge])))
  var succs = outIncidents(node, graph)

  var newCompound = flow(
    // remove the node inside the compound
    Graph.removeNode(nodeObj),
    // remove all ports that are not needed inside the compound anymore
    exclusivePorts.map((p) => Compound.removePort(p)),
    // add all a port for each output port of the excluded node
    Node.outputPorts(nodeObj, true).map((port) => Compound.addInputPort(port)),
    // add all outgoing edges from the newly created compound ports to their successors
    succs.map((edge) => Graph.addEdge({from: '@' + edge.from.port, to: edge.to}))
  )(parent)
  var newGraph = flow(
    // disconnect all edges whose ports get removed
    flow(portPreds.map((edges) => Graph.removeEdge(edges[0]))),
    Graph.replaceNode(parent, newCompound),
    Graph.addNodeByPath(Node.path(Graph.parent(parent, graph)), nodeObj),
    (graph, objs) => mergeNodes({id: nodeObj.id}, objs()[2], graph),
    portPreds.map((edges) => Graph.addEdge({from: edges[0].from, to: nodeObj.id + '@' + edges[1].to.port})),
    Node.outputPorts(nodeObj, true).map((port) => Graph.addEdge({from: nodeObj.id + '@' + port.port, to: parent.id + '@' + port.port}))
  )(graph)
  return newGraph
})

/**
 * Takes a compound node and moves all nodes out of the compound node and removes then removes the empty compound.
 * @params {Compound} node The compound node
 * @params {PortGraph} graph The graph in which the compound node lies.
 * @returns {PortGraph} The new graph where all nodes were moved out of the compound node.
 */
export const unCompound = curry((node, graph) => {
  var sorting = topologicalSort(Graph.node(node, graph))
  return flow(
    sorting.map((n) => excludeNode(n)),
    Graph.removeNode(node)
  )(graph)
})
