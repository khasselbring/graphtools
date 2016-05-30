
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
  return JSON.parse(JSON.stringify(graphlib.json.write(graph)))
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
  return _.filter(graph.nodes(), (n) => n.indexOf('_PORT_') !== -1).length !== 0
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

export function getAll (graph, id) {
  return _.filter(graph.nodes(), (n) => graph.node(n).id === id || graph.node(n).meta === id)
}

export function ports (graph, node) {
  var curNode = graph.node(node)
  return _.merge({}, curNode.inputPorts, curNode.outputPorts)
}

export function portType (graph, node, port) {
  return ports(graph, node)[port]
}

export function setPortType (graph, node, port, type) {
  var ports = (graph.node(node).inputPorts[port]) ? graph.node(node).inputPorts : graph.node(node).outputPorts
  ports[port] = type
}

export function portDirectionType (graph, node, port) {
  var curNode = graph.node(node)
  if (_.has(curNode.inputPorts, port)) {
    return 'inputPorts'
  } else if (_.has(curNode.outputPorts, port)) {
    return 'outputPorts'
  }
  throw new Error('The node ' + node + ' does not have a port with the name ' + port)
}
