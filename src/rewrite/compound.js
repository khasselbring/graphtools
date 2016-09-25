/**
 * Rewrite rules for compound nodes.
 */

import curry from 'lodash/fp/curry'
import any from 'lodash/fp/any'
import negate from 'lodash/fp/negate'
import {chain} from '../graph/chain'
import * as Compound from '../compound'
import {predecessor, predecessors, inIncidents, outIncidents} from '../graph/connections'
import * as Graph from '../graph'
import * as Node from '../node'
import {mergeNodes} from '../graph/internal'

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

  var newCompound = chain(
    // remove old port and add predecessor
    [
      Compound.removePort(port),
      Graph.addNode(predNode),
      // set the id of the included predecessor to the id of the predecessor
      (graph, objs) => mergeNodes({id: predNode.id}, objs()[1], graph)
    ]
    // add all input ports of predecessor
    .concat(preInPorts.map((edge) => Compound.addInputPort(edge.to)))
    .concat(preInPorts.map((edge) =>
        Graph.addEdge({from: '@' + edge.to.port, to: predNode.id + '@' + edge.to.port})))
    .concat(postInPorts.map((edge) =>
        Graph.addEdge({from: pred, to: edge.to})))
  )(compound)
  var newGraph = chain(
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
  var parent = Graph.parent(node, graph)
  var preds = predecessors(node, graph)
  if (any(negate(Node.equal(parent)), preds)) {
    throw new Error('Node has predecessor in the parent compound and thus cannot be moved out of the compound node.')
  }
})
