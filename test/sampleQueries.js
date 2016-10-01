import curry from 'lodash/fp/curry'
import * as Graph from '../src/graph'
import * as Node from '../src/node'
import * as Compound from '../src/compound'
import * as Port from '../src/port'

const Functional = {
  isLambdaImplementation: (n) => n.isLambdaImplementation
}

const Semantics = {
  isSink: (n) => n.sink
}

/*
// unnecessary if compounds are unpacked before rest?
const atomicSuccessorInPort = curry((port, graph) =>
  Graph.successors(port, {ignoreCompounds: true}, graph)
)

// unnecessary if compounds are unpacked before rest?
const atomicPredecessorOutPort = (graph, port) =>
  Graph.predecessors(graph, port, {ignoreCompounds: true})
*/

const isUnused = curry((node, graph) =>
  Graph.successors(node, graph).length === 0 &&
  !Functional.isLambdaImplementation(node) &&
  !Semantics.isSink(node))


const deleteUnusedPredecessors = curry((node, graph) =>
  Graph.predecessors(node, graph)
    .filter((p) => Graph.successors(p, graph)
      .every((s) => Node.equal(Port.node(s), node)))
    .reduce((curGraph, p) => Graph.removeNode(p, curGraph), graph))

const deleteIfUnused = curry((node, graph) => {
  if (isUnused(node, graph)) {
    return Graph.removeNode(node, deleteUnusedPredecessors(node, graph))
  }
  return graph
})

// replaceNode is part of graphtools API

const isUnnecessaryCompound = curry((node, graph) =>
  Compound.isCompound(node) &&
  !Compound.isRecursion(node) &&
  !Functional.isLambdaImplementation(node))

/**
 * what would the semantics of move be?? This is a rewrite function!?
 */
const unpackCompoundNode = curry((node, graph) =>
  Graph.moveNodes(Graph.children(node, graph), Graph.parent(node, graph), graph))

const removeEmptyCompound = curry((node, graph) => {
  if (Graph.children(node, graph).length !== 0) {
    throw new Error('Cannot remove non empty compound')
  }
  return Graph.removeNode(node, graph)
})

// createEdge to successor does not create a valid graph
// the successor will have two predecessors...
// this is a "skip target" ? where one (?) edge to the
// target gets redirected to its successors (multiple?)
// perhaps not necessary... used for replaceNode?
const skipTarget = curry((output, target, graph) =>
  Graph.flow(
    Graph.removeEdge(output, target, graph),
    (graph) =>
      Graph.successors(target, graph)
        .reduce((curGraph, s) =>
          Graph.flow(
            Graph.removeEdge(target, s),
            Graph.addEdge(output, s))
        , graph)))

const deepRemove = curry((node, graph) =>
  deleteUnusedPredecessors(node, graph)
    .removeNode(node))

/* move? */
const movePredecessorsInto = curry((from, to, graph) =>
  graph.predecessors(from).reduce((curGraph, p) =>
    curGraph.move(p, to), graph))

// Compound.removePort should be part of graphtools
// Compound.addInputPort(n, port, type)
// Compound.addOutputPort(n, port, type)
// Compound.renamePort(n, port, newName)

module.exports = {
  isUnused,
  deleteIfUnused,
  isUnnecessaryCompound,
  unpackCompoundNode,
  removeEmptyCompound,
  skipTarget,
  deepRemove,
  movePredecessorsInto
}
