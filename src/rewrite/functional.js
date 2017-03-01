/**
 * Rewriting basic structures into functional structures
 */

import curry from 'lodash/fp/curry'
import flatten from 'lodash/fp/flatten'
import * as Graph from '../graph'
import * as Node from '../node'
import {successors, predecessor} from '../graph/connections'
import * as CmpRewrite from './compound'
import {createLambda, createPartial, createFunctionCall} from '../functional/lambda'

const letF = Graph.letFlow

export const convertToLambda = curry((nodes, graph, ...cbs) => {
  const cb = Graph.flowCallback(cbs)
  return Graph.debugFlow(
    letF(CmpRewrite.compoundify(nodes), (compound, curGraph) => {
      const context = {
        inputs: Node.inputPorts(compound).map((input) => [input, predecessor(input, curGraph)]),
        outputs: Node.outputPorts(compound).map((output) => [output, successors(output, curGraph)])
      }
      return Graph.flow(
        letF(
          [
            Graph.addNode(createLambda(compound)),
            Graph.removeNode(compound)
          ],
          ([lambda], graph) => {
            context.lambda = lambda
            return cb(context, graph)
          })
      )(curGraph)
    })
  )(graph)
})

function createInputPartials (inputs, from) {
  return (graph, ...cbs) => {
    const cb = Graph.flowCallback(cbs)
    if (inputs.length > 0) {
      return letF(Graph.addNode(createPartial()), (newPartial, graph) =>
        Graph.flow(
          Graph.addEdge({from: Node.port('fn', from), to: Node.port('inFn', newPartial)}),
          Graph.addEdge({from: inputs[0][1], to: Node.port('value', newPartial)}),
          letF(createInputPartials(inputs.slice(1), newPartial), cb)
        )(graph))(graph)
    }
    return cb(from, graph)
  }
}

const createCall = (context) => (last, graph) =>
  Graph.letFlow(Graph.addNode(createFunctionCall(context.outputs)), (call, graph) =>
    Graph.debugFlow(
      Graph.addEdge({from: Node.port('fn', last), to: Node.port('fn', call)}),
      flatten(context.outputs.map(([port, succ]) =>
        succ.map((s) => Graph.addEdge({from: Node.port(port, call), to: s}))))
    )(graph))(graph)

export const replaceByCall = curry((nodes, graph) => {
  return Graph.flow(
    letF(convertToLambda(nodes), (context, graph) =>
      Graph.debugFlow(
        letF(createInputPartials(context.inputs, context.lambda), createCall(context))
      )(graph))
  )(graph)
})
