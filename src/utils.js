
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

export function isNPG (graph) {
  return !isNG(graph)
}

export function isNG (graph) {
  return !graph.isMultigraph()
}

export function isPortNode (nodeName) {
  return nodeName.split('_PORT_').length === 2
}

export function portNodePort (nodeName) {
  return nodeName.split('_PORT_')[1]
}

export function portNodeName (nodeName) {
  return nodeName.split('_PORT_')[0]
}

export function nthInput (graph, node, n) {
  var inputs = graph.node(node).inputPorts
  return _.keys(inputs)[n]
}

export function nthOutput (graph, node, n) {
  var outputs = graph.node(node).outputPorts
  return _.keys(outputs)[n]
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

export function rawHierarchyConnection (graph, edge) {
  var hFrom = hierarchy(graph, edge.v).slice(0, -1).map((f) => ({node: f, type: 'out'}))
  var hTo = hierarchy(graph, edge.w).slice(0, -1).map((t) => ({node: t, type: 'in'}))
  var hCon = _.dropWhile(_.zip(hFrom, hTo), (z) => {
    return z[0] && z[1] && z[0].node === z[1].node
  })
  var unzipH = _.unzip(hCon)
  return _.concat(_.compact(_.flatten([_.reverse(unzipH[0]), unzipH[1]])))
}

export function linkName (link) {
  var value = link.value
  return `[${link.v}@${value.outPort}→${link.w}@${value.inPort}]`
}

export function hierarchyConnection (graph, edge) {
  var hFrom = hierarchy(graph, edge.v).slice(0, -1)
  var hTo = hierarchy(graph, edge.w).slice(0, -1)
  var hCon = _.dropWhile(_.zip(hFrom, hTo), (f) => f[0] === f[1])
  var unzipH = _.unzip(hCon)
  return _.concat(_.compact(_.flatten([_.reverse(unzipH[0]), unzipH[1]])))
}

export function isConformityPort (p) {
  return p.indexOf('[') === 0 && p.indexOf(']') === p.length - 1
}

export function isConformityEdge (e) {
  return isConformityPort(e.value.inPort) || isConformityPort(e.value.outPort)
}
