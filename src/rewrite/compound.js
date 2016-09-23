/**
 * Rewrite rules for compound nodes.
 */

import curry from 'lodash/fp/curry'
import {chain} from '../graph/chain'
import * as Compound from '../compound'
import {predecessor, inIncidents} from '../graph/connections'
import * as Graph from '../graph'

export const includePredecessor = curry((port, graph) => {
  console.log(port)
  var pred = predecessor(port, graph)
  console.log('pred', pred)
  var preInPorts = inIncidents(pred.node, graph)

  console.log(pred, preInPorts)
  var newCompound = chain(
    // remove old port and add predecessor
    [
      Compound.removePort(port),
      Graph.addNode(Graph.node(pred, graph))
    ]
    // add all input ports of predecessor
    .concat(preInPorts.map((edge) => Compound.addInputPort(edge.to)))
    .concat(preInPorts.map((edge) =>
      (graph, objs) =>
        Graph.addEdge({from: '@' + edge.to.port, to: objs()[1].id + '@' + edge.to.port})(graph)))
  )(Graph.node(port, graph))
  var newGraph = chain(
    Graph.removeNode(pred),
    Graph.replaceNode(port, newCompound)
  )(graph)
  console.log(Graph.edges(graph).length, Graph.edges(newGraph).length)
  return graph
})
