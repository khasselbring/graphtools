
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
  if (typeof (followPorts) === 'string') {
    followPorts = [followPorts]
  }
  var nextNodes = _.flatten(_.map(followPorts, (port) => edgeFollow(node, port).plant(graph.nodeEdges(node)).value()))
  return _.flatten(_.concat([node], _.map(nextNodes, (pred) => functionWalk(graph, pred, pathFn, edgeFollow))))
}

function arrayWalk (graph, node, pathArray, edgeFollow) {
  return _.reduce(pathArray, (nodes, p) => {
    var curNode = _.last(nodes)
    return _.concat(nodes, edgeFollow(curNode, p).plant(graph.nodeEdges(_.last(nodes))).flatten().value())
  }, [node])
}
