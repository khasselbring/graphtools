
import graphlib from 'graphlib'
import _ from 'lodash'

export function clone (graph) {
  if (typeof (graph.graph) === 'function') {
    return graphlib.json.read(graphlib.json.write(graph))
  } else {
    return _.clone(graph)
  }
}

export function edit (graph) {
  return graphlib.json.write(graph)
}

export function finalize (editGraph) {
  return graphlib.json.read(editGraph)
}

export function prefixName (prefix, name) {
  return `${prefix}:${name}`
}

export function prefixNode (prefix, node) {
  return _.merge({}, node, {v: prefixName(prefix, node.v)})
}

export function addParent (parent, node) {
  return _.merge({}, node, {parent: parent})
}

export function hierarchy (graph, node, h = []) {
  return (node) ? hierarchy(graph, graph.parent(node), _.concat([node], h)) : h
}

export function hierarchyConnection (graph, edge) {
  var hFrom = _.reverse(hierarchy(graph, edge.v).slice(0, -1))
  var hTo = hierarchy(graph, edge.w).slice(0, -1)
  var hCon = _.dropWhile(_.zip(hFrom, hTo), (f, t) => f === t)
  return _.concat(_.compact(_.flatten(_.unzip(hCon))))
}

export function isConformityPort (p) {
  return p.indexOf('[') === 0 && p.indexOf(']') === p.length -1
}

export function isConformityEdge (e) {
  return isConformityPort(e.inPort) || isConformityPort(e.outPort)
}
