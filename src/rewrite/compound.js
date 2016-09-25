/**
 * Rewrite rules for compound nodes.
 */

import curry from 'lodash/fp/curry'
import {chain} from '../graph/chain'
import * as Compound from '../compound'
import {predecessor, inIncidents} from '../graph/connections'
import * as Graph from '../graph'
import {mergeNodes} from '../graph/internal'

export const includePredecessor = curry((port, graph) => {
  var pred = predecessor(port, graph)
  var predNode = Graph.node(pred, graph)
  var preInPorts = inIncidents(pred.node, graph)
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
