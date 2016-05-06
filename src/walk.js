
import _ from 'lodash'
import * as utils from './utils'
import * as walkNPG from './walkNetworkPortGraph'
import * as walkNG from './walkNetworkGraph'

export function predecessor (graph, node, port) {
  return (utils.isNPG(graph))
      ? walkNPG.predecessor(graph, node, port)
      : walkNG.predecessor(graph, node, port)
}

export function successor (graph, node, port) {
  return (utils.isNPG(graph))
      ? walkNPG.successor(graph, node, port)
      : walkNG.successor(graph, node, port)
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
  var nodes = _.flatten(_.compact(_.map(ports, _.partial(adjacentNode, graph, node, _, edgeFollow))))
  if (nodes.length === 0) return
  return nodes
}

function generalWalk (graph, node, path, edgeFollow) {
  if (Array.isArray(path)) {
    return pickNodeNames(arrayWalk(graph, {node: node}, path, edgeFollow))
  } else if (typeof (path) === 'function') {
    return pickNodeNames(functionWalk(graph, {node: node}, path, edgeFollow))
  } else {
    return undefined
  }
}

function pickNodeNames (pathes) {
  return _.map(pathes, _.partial(_.map, _, 'node'))
}

function functionWalk (graph, node, pathFn, edgeFollow, port) {
  var followPorts = pathFn(graph, node.node, port)
  if (!followPorts || followPorts.length === 0) {
    return [[node]]
  }
  var nextNodes = adjacentNodes(graph, node.node, followPorts, edgeFollow)
  var paths = _(nextNodes)
    .map((nodeObj = {node, port}) => functionWalk(graph, nodeObj, pathFn, edgeFollow, port))
    .compact()
    .value()
//  var paths = _.compact(_.map(nextNodes, (pred) => _.flatten(functionWalk(graph, pred, pathFn, edgeFollow))))
  return _.map(paths, (path) => _.flatten(_.concat([node], path)))
}

function arrayWalk (graph, node, pathArray, edgeFollow) {
  return _.reduce(pathArray, (nodes, p) => {
    return _(nodes)
      .map((path) => {
        var curNode = _.last(path)
        var nextNodes = adjacentNodes(graph, curNode.node, p, edgeFollow)
        if (!nextNodes) return
        return _.map(nextNodes, (n) => _.concat(path, n))
      })
      .flatten()
      .compact()
      .value()
  }, [[node]])
}
