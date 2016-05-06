import graphlib from 'graphlib'
import _ from 'lodash'

var markNodes = function (graph, subset) {
  for (let n of subset) {
    graph.node(n).mark = true
  }
}

var firstMarkedIndex = function (graph, topsort) {
  for (let i = 0; i < topsort.length; i++) {
    if (graph.node(topsort[i]).mark) {
      return i
    }
  }
  return topsort.length
}

var lastMarkedIndex = function (graph, topsort) {
  var last = 0
  for (let i = 0; i < topsort.length; i++) {
    if (graph.node(topsort[i]).mark) {
      last = i
    }
  }
  return last
}

// checks if the element is blocked forward
var checkForward = function (elem, graph, topsort, last) {
  if (_.indexOf(topsort, elem) > last) { return false }
  if (graph.node(elem).mark) { return true }
  for (let succ of graph.successors(elem)) {
    if (checkForward(succ, graph, topsort, last)) { return true }
  }
}

// checks if the element is blocked backward
var checkBackward = function (elem, graph, topsort, first) {
  if (_.indexOf(topsort, elem) > first) { return false }
  if (graph.node(elem).mark) { return true }
  for (let pred of graph.predecessors(elem)) {
    if (checkBackward(pred, graph, topsort, first)) { return true }
  }
}

export function isCompoundable (g, subset) {
  var graph = graphlib.json.read(JSON.parse(JSON.stringify(graphlib.json.write(g))))
  markNodes(graph, subset)
  var topsort = graphlib.alg.topsort(graph)
  var first = firstMarkedIndex(graph, topsort)
  var last = lastMarkedIndex(graph, topsort)
  for (let i = 0; i < topsort.length; i++) {
    if (!graph.node(topsort[i]).mark) {
      if (i < first || i > last) {
        continue
      }
      if (checkForward(topsort[i], graph, topsort, last) && checkBackward(topsort[i], graph, topsort)) {
        return false
      }
    }
  }
  return true
}

// TODO: Unfinished
export function compoundify (g, subset) {
  if (!isCompoundable(g, subset)) { throw new Error('This subset cannot be compoundified given this particular subset.') }
  var graph = graphlib.json.read(JSON.parse(JSON.stringify(graphlib.json.write(g))))
  markNodes(graph, subset)
  console.log(JSON.stringify(graphlib.json.write(graph)))
  return graph
}