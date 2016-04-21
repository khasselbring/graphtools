
import _ from 'lodash'

export function successor (graph, node, port) {
  var edges = graph.nodeEdges(node)
  var nodes = _.filter(edges, (e) => e.w === node + '_PORT_' + port).map((e) => e.w)
  for (var i = 0; i < nodes.length; i++) {
    while (graph.node(nodes[i])['nodeType'] !== 'process') {
      var successors = graph.successors(nodes[i])
      nodes[i] = successors[0]
      nodes = nodes.concat(successors.slice(1, successors.length))
    }
  }
  return nodes
}

export function predecessor (graph, node, port) {
  var edges = graph.nodeEdges(node)
  var nodes = _.filter(edges, (e) => e.v === node + '_PORT_' + port).map((e) => e.v)
  for (var i = 0; i < nodes.length; i++) {
    while (graph.node(nodes[i])['nodeType'] !== 'process') {
      var predecessors = graph.predecessors(nodes[i])
      nodes[i] = predecessors[0]
      nodes = nodes.concat(predecessors.slice(1, predecessors.length))
    }
  }
  return nodes
}

export function predecessorPort (graph, node, port) {
  var edges = graph.nodeEdges(node)
  var nodes = _.filter(edges, (e) => e.v === node + '_PORT_' + port).map((e) => e.v)
  for (var i = 0; i < nodes.length; i++) {
    var predecessors = graph.predecessors(nodes[i])
    while (graph.predecessors(predecessors[0]).length > 0 && graph.node(predecessors[0]).hierarchyBorder) {
      predecessors = graph.predecessors(predecessors[0])
    }
    nodes[i] = predecessors[0]
    nodes = nodes.concat(predecessors.slice(1, predecessors.length))
  }
  nodes = _.compact(nodes).map(function (n) {
    return n.split('_')[n.split('_').length - 1]
  })
  return nodes
}

export function walk (graph, node, path) {
  return generalWalk(graph, node, path, successor)
}

/**
 * returns all pathes tracked by the path that defines the ports.
 * The path will be pointing to node (node will be the last item of the result)
 * it follows the direction of the directed edges
 */
export function walkBack (graph, node, path) {
  return _.map(generalWalk(graph, node, path, predecessor), _.reverse)
}

/**
 * returns a list of adjacent nodes for one port of a node
 */
export function adjacentNode (graph, node, port, edgeFollow) {
  var adjacents = edgeFollow(graph, node, port)
  if (adjacents.length === 0) return
  else return adjacents
}

/**
 * returns a list of adjacent of a node
 */
export function adjacentNodes (graph, node, ports, edgeFollow) {
  if (!Array.isArray(ports)) {
    ports = [ports]
  }
  var nodes = _.compact(_.map(ports, _.partial(adjacentNode, graph, node, _, edgeFollow)))
  if (nodes.length === 0) return
  return nodes
}

function generalWalk (graph, node, path, edgeFollow) {
  if (Array.isArray(path)) {
    return arrayWalk(graph, node, path, edgeFollow)
  } else if (typeof (path) === 'function') {
    return functionWalk(graph, node, path, edgeFollow)
  } else {
    return undefined
  }
}

function functionWalk (graph, node, pathFn, edgeFollow) {
  var followPorts = pathFn(graph, node)
  if (!followPorts || followPorts.length === 0) {
    return [[node]]
  }
  var nextNodes = adjacentNodes(graph, node, followPorts, edgeFollow)
  var paths = _.compact(_.map(nextNodes, (pred) => _.flatten(functionWalk(graph, pred, pathFn, edgeFollow))))
  return _.map(paths, (path) => _.flatten(_.concat([node], path)))
}

function arrayWalk (graph, node, pathArray, edgeFollow) {
  return _.reduce(pathArray, (nodes, p) => {
    return _(nodes)
      .map((path) => {
        var curNode = _.last(path)
        var nextNodes = adjacentNodes(graph, curNode, p, edgeFollow)
        if (!nextNodes) return
        return _.map(nextNodes, (n) => _.concat(path, n))
      })
      .flatten()
      .compact()
      .value()
  }, [[node]])
}
