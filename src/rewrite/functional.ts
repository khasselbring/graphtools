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
import {GraphAction} from '../graph/graphaction'

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

function createLambdaNode (compound:Node.Node):GraphAction {
  return (graph, ...cbs) => {
    const cb = Graph.flowCallback(cbs)
    return sequential([Graph.addNode(createLambda(compound)), createContext(compound), cb])(graph)
  }
}

/**
 * @description
 * Create a lambda node that contains the given subset of nodes. It will not connect the inputs and
 * outputs use createCall for that.
 * @param {Array<Location>} subset A subset of nodes in the graph that should be included in the lambda node.
 * @param {Portgraph} graph The graph
 * @param {Callback} [cb] A callback that is called after the lambda node is created. The context
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
export function convertToLambda (subset:any[]):GraphAction {
  return (graph, ...cbs) => {
    const cb = Graph.flowCallback(cbs)
    return CmpRewrite.compoundify(subset)(graph, (compound, compGraph) =>
      Graph.flow(
        letF(createLambdaNode(compound), cb), // create lambda node and pass information to callback
        Graph.removeNode(compound) // remove the old compound node in the end
      )(compGraph))
  }
}

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

const createCall = ([context, last], graph) =>
  Graph.Let(Graph.addNode(createFunctionCall(context.outputs)), (call, graph) =>
    Graph.flow(
      Graph.addEdge({from: Node.port('fn', last), to: Node.port('fn', call)}),
      flatten(context.outputs.map(([port, succ]) =>
        succ.map((s) => Graph.addEdge({from: Node.port(port, call), to: s}))))
    )(graph))(graph)

/**
 * Takes a subset of nodes (all of them must have the same parent) and replaces them
 * by a lambda function, the partial application of their inputs and a call with all
 * outputs connected to the subsets successors.
 * @param {Array<Location>} subset A subset of locations identifying nodes which will be replaced by
 * a lambda call.
 * @param {Portgraph} graph The graph
 * @returns {Portgraph} A new graph in which the subset was replaced by a call to a lambda
 * function.
 */
export const replaceByCall = curry((subset, graph) =>
  replaceByThunk(subset, graph, createCall))

const ternaryPack = (fn) =>
  curry((a, b, graph) => {
    return fn([a, b], graph)
  })

/**
 * Takes a subset of nodes (all of them must have the same parent) and replaces them
 * by a lambda function, the partial application of their inputs It will not call the
 * lambda function and thus their outputs will not be connected. If you want to connect
 * the outputs after the call use replaceByCall. Information about the successors is accessible
 * via the context-callback.
 * @param {Array<Location>} subset A subset of locations identifying nodes which will be replaced by
 * a lambda call.
 * @param {Portgraph} graph The graph
 * @param {Callback} [contextCallback] A context callback that is called after the thunk is created.
 * It has the signature [Context x Node] x Graph -> Graph . The context contains information about the
 * lambda node, and the successors. The second parameter is the last partial/lambda node that
 * outputs the thunk. The callback must return a graph which then will be the return value of this
 * function (replaceByThunk). The context object has the following structure:
 *
 * ```
 * {
 *   "lambda": "<The lambda node>",
 *   "inputs": [[<inputPort>, <predecessor>], ...],
 *   "outputs": [[<outputPort, [<successors>, ...]],...]
 * }
 * ```
 *
 * The predecessors are already connected to create a thunk.
 * @returns {Portgraph} A new graph in which the subset was replaced by a call to a lambda
 * function. **Caution**: The new graph will not connect the output of the lambda function
 * use the context-callback to connect the outputs.
 * @example <caption>replaceByCall implementation</caption>
 * // create call is a context-callback that creates a call node and connects it properly
 * export const replaceByCall = curry((subset, graph) =>
 *   replaceByThunk(subset, graph, createCall))
 * @example <caption>Log the not connected successors as an array.</caption>
 * replaceByThunk(subset, graph, curry((context, last, graph) => {
 *   console.log(flatten(context.outputs.map((o) => o[1])))
 * }))
 */
export const replaceByThunk = curry((subset, graph, ...cbs) =>
  convertToLambda(subset, graph, distSeq([createInputPartials, ternaryPack(Graph.flowCallback(cbs))])))
