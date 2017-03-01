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

const letF = Graph.Let
const distSeq = Graph.distributeSeq
const sequential = Graph.sequential

const createContext = curry((compound, lambda, graph, ...cbs) => {
  const cb = Graph.flowCallback(cbs)
  return cb({
    inputs: Node.inputPorts(compound).map((input) => [input, predecessor(input, graph)]),
    outputs: Node.outputPorts(compound).map((output) => [output, successors(output, graph)]),
    lambda
  }, graph)
})

function createLambdaNode (compound) {
  return (graph, ...cbs) => {
    const cb = Graph.flowCallback(cbs)
    return Graph.addNode(createLambda(compound), graph, sequential([createContext(compound), cb]))
  }
}

/**
 * @function
 * @name convertToLambda
 * @description
 * Create a lambda node that contains the given subset of nodes. It will not connect the inputs and
 * outputs use createCall for that.
 * @param {Array<Location>} subset A subset of nodes in the graph that should be included in the lambda node.
 * @param {Portgraph} graph The graph
 * @param {Function<Context, Portgraph>} [cb] A callback that is called after the lambda node is created. The context
 * will be an object that contains the lambda node, the predecessors of the subset and the successors of that subset. I.e.
 * the context object will look like this:
 *
 * ```
 * {
 *   "lambda": "<The lambda node>",
 *   "inputs": [[<inputPort>, <predecessor>], ...],
 *   "outputs": [[<outputPort, [<successors>, ...]],...]
 * }
 * ```
 *
 * The graph is the new graph which includes the lambda nodes and in which the subset has been removed. The return
 * value of the callback function must be a graph (i.e. a graph in which you connect the remaining parts).
 * @returns {Portgraph} A new graph that replaced the subset with a lambda node. If a callback is given, the callback
 * is applied to the graph before `convertToLambda` returns and the return value of that callback is returned.
 */
export const convertToLambda = curry((subset, graph, ...cbs) => {
  const cb = Graph.flowCallback(cbs)
  return CmpRewrite.compoundify(subset, graph, (compound, compGraph) =>
    Graph.flow(
      letF(createLambdaNode(compound), cb), // create lambda node and pass information to callback
      Graph.removeNode(compound) // remove the old compound node in the end
    )(compGraph))
})

function createInputPartialsInternal (inputs, from) {
  return (graph, ...cbs) => {
    const cb = Graph.flowCallback(cbs)
    if (inputs.length > 0) {
      return Graph.addNode(createPartial(), graph, (newPartial, graph) =>
        Graph.flow(
          Graph.addEdge({from: Node.port('fn', from), to: Node.port('inFn', newPartial)}),
          Graph.addEdge({from: inputs[0][1], to: Node.port('value', newPartial)}),
          letF(createInputPartialsInternal(inputs.slice(1), newPartial), cb)
        )(graph))
    }
    return cb(from, graph)
  }
}

export const createInputPartials = curry((context, graph, ...cbs) => {
  return createInputPartialsInternal(context.inputs, context.lambda)(graph, ...cbs)
})

const createCall = (context) => (last, graph) =>
  Graph.Let(Graph.addNode(createFunctionCall(context.outputs)), (call, graph) =>
    Graph.flow(
      Graph.addEdge({from: Node.port('fn', last), to: Node.port('fn', call)}),
      flatten(context.outputs.map(([port, succ]) =>
        succ.map((s) => Graph.addEdge({from: Node.port(port, call), to: s}))))
    )(graph))(graph)

export const replaceByCall = curry((nodes, graph) => {
  return convertToLambda(nodes, graph, distSeq([createInputPartials, createCall]))
})
