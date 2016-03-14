
import _ from 'lodash'

export function walk (graph, node, path) {
  var getOtherEnd = (node, port) =>
    _([])
      .filter((e) => graph.edge(e).outPort === port)
      .map((e) => e.w)
  return generalWalk(graph, node, path, getOtherEnd)
}

export function walkBack (graph, node, path) {
  var getOtherEnd = (node, port) =>
    _([])
      .filter((e) => graph.edge(e).inPort === port)
      .map((e) => e.v)
  return generalWalk(graph, node, path, getOtherEnd)
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
  } else if (typeof (followPorts) === 'string') {
    followPorts = [followPorts]
  }
  var nextNodes = _.flatten(_.map(followPorts, (port) => edgeFollow(node, port).plant(graph.nodeEdges(node)).value()))
  if (nextNodes.length === 0) return
  var path = _.compact(_.map(nextNodes, (pred) => functionWalk(graph, pred, pathFn, edgeFollow)))
  if (path.length === 0) return
  return _.flatten(_.concat([node], path))
}

function arrayWalk (graph, node, pathArray, edgeFollow) {
  return _.reduce(pathArray, (nodes, p) => {
    if (!nodes) return
    var curNode = _.last(nodes)
    var nextNodes = edgeFollow(curNode, p).plant(graph.nodeEdges(_.last(nodes))).flatten().value()
    if (nextNodes.length === 0) return
    return _.concat(nodes, nextNodes)
  }, [node])
}
