
import _ from 'lodash'

export var successor = (graph, node, port) =>
    _(graph.nodeEdges(node))
      .filter((e) => graph.edge(e).outPort === port)
      .map((e) => e.w)
      .value()

export var predecessor = (graph, node, port) =>
    _(graph.nodeEdges(node))
      .filter((e) => graph.edge(e).inPort === port)
      .map((e) => e.v)
      .value()

export function walk (graph, node, path) {
  return generalWalk(graph, node, path, successor)
}

export function walkBack (graph, node, path) {
  return generalWalk(graph, node, path, predecessor)
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
  if (!followPorts) {
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
