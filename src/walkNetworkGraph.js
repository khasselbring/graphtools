
import {portNodeName, portNodePort, nthInput, nthOutput} from './utils'
import _ from 'lodash'

function getSuccessorWithCheck (graph, curNode, node, port) {
  var successors = graph.successors(curNode)
  if (successors.length > 1) {
    throw new Error('Invalid port graph, every port can only have one successor (violated for ' + node + '@' + port + ' while searching for successors of ' + curNode + ')')
  }
  return _.merge({}, graph.node(successors[0]), {name: successors[0]})
}

function getPredecessorWithCheck (graph, curNode, node, port) {
  var predecessors = graph.predecessors(curNode)
  if (predecessors.length > 1) {
    throw new Error('Invalid port graph, every port can only have one predecessor (violated for ' + node + '@' + port + ' while searching for predecessor of ' + curNode + ')')
  }
  return _.merge({}, graph.node(predecessors[0]), {name: predecessors[0]})
}

function neighbor (graph, node, port, neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn) {
  var edges = graph.edges()
  var portNode = node + '_PORT_' + port
  var nodes = _.filter(edges, (e) => e[nType] === portNode).map((e) => e[nType])
  if (nodes.length > 1) {
    throw new Error('Invalid port graph, every port can only have one predecessor (violated for ' + node + '@' + port + ')')
  }
  var resNodes = _.flatten(_.map(nodes, (curNode) => {
    var neigh = neighborFn(curNode)
    var lastPort = null
    while (neigh.nodeType !== 'process' && !neigh.hierarchyBorder) {
      if (neigh.name.indexOf('_PORT_') !== -1) {
        lastPort = portNodePort(neigh.name)
      }
      neigh = neighborFn(neigh.name)
    }
    if (neigh.hierarchyBorder) {
      lastPort = portNodePort(neigh.name)
      return {node: portNodeName(neigh.name), port: lastPort}
    }
    // this is still ugly.. jumps over duplicates and joins
    if (neigh.name.indexOf(multiCase) !== -1) {
      return _.flatten([
        neighbor(graph, neigh.name, multiPortFn(graph, neigh.name, 0), neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn),
        neighbor(graph, neigh.name, multiPortFn(graph, neigh.name, 1), neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn)
      ])
    } else if (neigh.name.indexOf(jumpOver) !== -1) {
      return neighbor(graph, neigh.name, multiPortFn(graph, neigh.name, 0), neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn)
    }
    return {node: neigh.name, port: lastPort}
  }))
  return resNodes
}

export function successor (graph, node, port) {
  return neighbor(graph, node, port, _.partial(getSuccessorWithCheck, graph, _, node, port), 'v', '_DUPLICATE_', nthOutput, '_JOIN_', nthOutput)
}

export function predecessor (graph, node, port) {
  return neighbor(graph, node, port, _.partial(getPredecessorWithCheck, graph, _, node, port), 'w', '_JOIN_', nthInput, '_DUPLICATE_', nthInput)
}
