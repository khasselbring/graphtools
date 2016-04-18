
import _ from 'lodash'

export var successor = (graph, node, port) =>
    _(graph.nodeEdges(node))
      .filter((e) => e.v === node)
      .filter((e) => graph.edge(e).outPort === port)
      .map((e) => e.w)
      .value()

export var successorInPort = (graph, node, port) =>
  _(graph.nodeEdges(node))
      .filter((e) => e.v === node)
      .filter((e) => graph.edge(e).outPort === port)
      .map((e) => ({node: e.w, port: graph.edge(e).inPort}))
      .value()

export var predecessor = (graph, node, port) =>
    _(graph.nodeEdges(node))
      .filter((e) => e.w === node)
      .filter((e) => graph.edge(e).inPort === port)
      .map((e) => e.v)
      .value()

export var predecessorOutPort = (graph, node, port) =>
  _(graph.nodeEdges(node))
      .filter((e) => e.w === node)
      .filter((e) => graph.edge(e).inPort === port)
      .map((e) => ({node: e.v, port: graph.edge(e).outPort}))
      .value()

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
    return adjacentNode(graph, node, ports, edgeFollow)
  }
  var nodes = _.map(ports, _.partial(adjacentNode, graph, node, _, edgeFollow))
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
    return [node]
  }
  var nextNodes = adjacentNodes(graph, node, followPorts, edgeFollow)
  var paths = _.compact(_.map(nextNodes, (pred) => functionWalk(graph, pred, pathFn, edgeFollow)))
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
