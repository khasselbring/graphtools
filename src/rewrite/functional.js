/**
 * Rewriting basic structures into functional structures
 */

import curry from 'lodash/fp/curry'
import * as Graph from '../graph'
import * as CmpRewrite from './compound'
import {createLambda} from '../functional/lambda'

export const functionify = curry((nodes, graph) => {
  return Graph.debugFlow(
    CmpRewrite.compoundify(nodes),
    (graph, objs) => Graph.addNode(createLambda(objs()[0]), graph),
    (graph, objs) => Graph.removeNode(objs()[0], graph)
  )(graph)
})
