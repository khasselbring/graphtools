/**
 * Rewrite rules for compound nodes.
 */

import curry from 'lodash/fp/curry'
// import {chain} from '../graph/chain'
// import * as Compound from '../compound'
import {predecessor, inIncidents} from '../graph/connections'

export const includePredecessor = curry((port, graph) => {
  console.log(port)
  var pred = predecessor(port, graph)
  console.log('pred', pred)
  var preInPorts = inIncidents(pred)

  console.log(pred, preInPorts)
  return graph
})
