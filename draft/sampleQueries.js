import * as Graph from '../src/graph'
import * as Node from '../src/node'
import * as Compound from '../src/compound'

const Functional = {
  isLambdaImplementation: (n) => n.isLambdaImplementation
}

const Semantics = {
  isSink: (n) => n.sink
}

const Port = {
  node: (p) => p.node
}

// unnecessary if compounds are unpacked before rest?
const atomicSuccessorInPort = (graph, port) =>
  Graph.successors(graph, port, {ignoreCompounds: true})

// unnecessary if compounds are unpacked before rest?
const atomicPredecessorOutPort = (graph, port) =>
  Graph.predecessors(graph, port, {ignoreCompounds: true})

const isUnused = (graph, node) =>
  Graph.successors(graph, node).length === 0 &&
  !Functional.isLambdaImplementation(node) &&
  !Semantics.isSink(node)


const deleteUnusedPredecessors = (graph, node) =>
  Graph.predecessors(graph, node)
    .filter((p) => Graph.successors(graph, p)
      .every((s) => Node.equal(Port.node(s), node)))
    .reduce((curGraph, p) => curGraph.removeNode(p), graph)

const deleteIfUnused = (graph, node) => {
  if (isUnused(graph, node)) {
    return graph.removeNode(deleteUnusedPredecessors(graph, node), node)
  }
  return graph
}

// replaceNode is part of graphtools API

const isUnnecessaryCompound = (graph, node) =>
  Compound.isCompound(node) &&
  !Compound.isRecursion(node) &&
  !Functional.isLambdaImplementation(node)

const unpackCompoundNode = (graph, node) =>
  Graph.nodes(node).reduce((curGraph, n) =>
    curGraph.moveNode(n, graph.parent(node)), graph)

const removeEmptyCompound = (graph, node) => {
  if (graph.children(node).length !== 0) {
    throw new Error('Cannot remove non empty compound')
  }
  return graph.removeNode(node)
}

// createEdge to successor does not create a valid graph
// the successor will have two predecessors...
// this is a "skip target" ? where one (?) edge to the
// target gets redirected to its successors (multiple?)
// perhaps not necessary... used for replaceNode?
const skipTarget = (graph, output, target) =>
  graph.removeEdge(output, target)
    .successors(target)
    .reduce((curGraph, s) => curGraph
      .removeEdge(target, s)
      .addEdge(output, s), graph)

const deepRemove = (graph, node) =>
  deleteUnusedPredecessors(graph, node)
    .removeNode(node)

const movePredecessorsInto = (graph, from, to) =>
  graph.predecessors(from).reduce((curGraph, p) =>
    curGraph.move(p, to), graph)

// Compound.removePort should be part of graphtools
// Compound.createInputPort(n, port, type)
// Compound.createOutputPort(n, port, type)
// Compound.renamePort(n, port, newName)

module.exports = {
  atomicSuccessorInPort,
  atomicPredecessorOutPort,
  isUnused,
  deleteIfUnused,
  isUnnecessaryCompound,
  unpackCompoundNode,
  removeEmptyCompound,
  skipTarget,
  deepRemove,
  movePredecessorsInto
}
