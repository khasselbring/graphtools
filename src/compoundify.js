import graphlib from 'graphlib'
import _ from 'lodash'
import hash from 'object-hash'

var markNodes = function (graph, subset) {
  for (let n of subset) {
    graph.node(n).mark = true
  }
}

var contains = function (graph, subset) {
  var nodes = graph.nodes()
  for (let n of subset) {
    if (!_.includes(nodes, n)) {
      return false
    }
  }
  return true
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
var blockedForward = function (elem, graph, topsort, last) {
  if (_.indexOf(topsort, elem) > last) { return false }
  if (graph.node(elem).mark) { return true }
  for (let succ of graph.successors(elem)) {
    if (blockedForward(succ, graph, topsort, last)) { return true }
  }
}

// checks if the element is blocked backward
var blockedBackward = function (elem, graph, topsort, first) {
  if (_.indexOf(topsort, elem) > first) { return false }
  if (graph.node(elem).mark) { return true }
  for (let pred of graph.predecessors(elem)) {
    if (blockedBackward(pred, graph, topsort, first)) { return true }
  }
}

var sameParents = function (graph, subset) {
  if (subset.length < 1) { return true }
  var par = graph.parent(subset[0])
  for (let n of subset) {
    if (graph.parent(n) !== par) { return false }
  }
  return true
}

export function isCompoundable (g, subset) {
  var graph = graphlib.json.read(JSON.parse(JSON.stringify(graphlib.json.write(g))))
  if (!sameParents(graph, subset) || !graph.isCompound() || !contains(graph, subset)) { return false }
  markNodes(graph, subset)
  var topsort = graphlib.alg.topsort(graph)
  var first = firstMarkedIndex(graph, topsort)
  var last = lastMarkedIndex(graph, topsort)
  for (let i = 0; i < topsort.length; i++) {
    if (!graph.node(topsort[i]).mark) {
      if (i < first || i > last) {
        continue
      }
      if (blockedForward(topsort[i], graph, topsort, last) && blockedBackward(topsort[i], graph, topsort)) {
        return false
      }
    }
  }
  return true
}

export function compoundify (g, subset, name, label) {
  if (!isCompoundable(g, subset)) { throw new Error('This subset cannot be compoundified given this particular subset.') }
  if (subset.length < 1) { return g }
  var graph = graphlib.json.read(JSON.parse(JSON.stringify(graphlib.json.write(g))))
  if (!name) {
    name = 'comp' + hash(graph)
  }

  markNodes(graph, subset)
  graph.setNode(name, label)

  for (let n of subset) {
    graph.setParent(n, name)
  }
  return graph
}
