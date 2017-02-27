/**
 * Rewriting basic structures into functional structures
 */

import curry from 'lodash/fp/curry'
import * as Graph from '../graph'
import * as CmpRewrite from './compound'
import {createLambda} from '../functional/lambda'

const letF = Graph.letFlow
const Node = Graph.Node

export const functionify = curry((nodes, graph, ...cb) => {
  return Graph.debugFlow(
    letF(CmpRewrite.compoundify(nodes), (compound, curGraph) => {
      const context = {
        inputs: Node.inputPorts(compound).map((input) => [input, Graph.predecessor(input, curGraph)]),
        outputs: Node.outputPorts(compound).map((output) => [output, Graph.successor(output, curGraph)])
      }
      return cb(context, Graph.flow(
        Graph.addNode(createLambda(compound), graph),
        Graph.removeNode(compound, graph)
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
