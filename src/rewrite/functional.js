/**
 * Rewriting basic structures into functional structures
 */

import curry from 'lodash/fp/curry'
import * as Graph from '../graph'
import * as Node from '../node'
import {successors, predecessor} from '../graph/connections'
import * as CmpRewrite from './compound'
import {createLambda} from '../functional/lambda'

const letF = Graph.letFlow

export const functionify = curry((nodes, graph, ...cbs) => {
  const cb = Graph.flowCallback(cbs)
  return Graph.debugFlow(
    letF(CmpRewrite.compoundify(nodes), (compound, curGraph) => {
      const context = {
        inputs: Node.inputPorts(compound).map((input) => [input, predecessor(input, curGraph)]),
        outputs: Node.outputPorts(compound).map((output) => [output, successors(output, curGraph)])
      }
      return cb(context, Graph.flow(
        Graph.addNode(createLambda(compound)),
        Graph.removeNode(compound)
      )(curGraph))
    })
  )(graph)
})

/*
export const replaceByCall = curry((nodes, graph) => {
  return Graph.flow(
    let(functionify(nodes), (context, graph) => {
      context.inputs.map((input) => Graph.addNode(createPartial()))
      Graph.addNode(createFunctionCall(context.outputs))
    })
  )(graph)
})
*/
