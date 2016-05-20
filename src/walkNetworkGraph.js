
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

function neighbor (graph, node, port, neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn, partialEdge) {
  var edges = _.reject(graph.edges(), (e) => graph.edge(e) && graph.edge(e).continuation)
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
      return {node: portNodeName(neigh.name), port: lastPort,
        edge: _.merge({
          from: (nType === 'v') ? node : portNodeName(neigh.name),
          to: (nType === 'v') ? portNodeName(neigh.name) : node,
          outPort: (nType === 'v') ? port : lastPort,
          inPort: (nType === 'v') ? lastPort : port
        }, partialEdge)
      }
    }
    // this is still ugly.. jumps over duplicates and joins
    if (neigh.name.indexOf(multiCase) !== -1) {
      return _.flatten([
        neighbor(graph, neigh.name, multiPortFn(graph, neigh.name, 0), neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn, partialEdge),
        neighbor(graph, neigh.name, multiPortFn(graph, neigh.name, 1), neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn, partialEdge)
      ])
    } else if (neigh.name.indexOf(jumpOver) !== -1) {
      return neighbor(graph, neigh.name, multiPortFn(graph, neigh.name, 0), neighborFn, nType, multiCase, multiPortFn, jumpOver, jumpOverFn, partialEdge)
    }
    return {node: neigh.name, port: lastPort,
      edge: _.merge({
        from: (nType === 'v') ? node : neigh.name,
        to: (nType === 'v') ? neigh.name : node,
        outPort: (nType === 'v') ? port : lastPort,
        inPort: (nType === 'v') ? lastPort : port
      }, partialEdge)}
  }))
  return resNodes
}

export function successor (graph, node, port) {
  var edge = {from: node, outPort: port}
  return neighbor(graph, node, port, _.partial(getSuccessorWithCheck, graph, _, node, port), 'v', '_DUPLICATE_', nthOutput, '_JOIN_', nthOutput, edge)
}

export function predecessor (graph, node, port) {
  var edge = {to: node, inPort: port}
  return neighbor(graph, node, port, _.partial(getPredecessorWithCheck, graph, _, node, port), 'w', '_JOIN_', nthInput, '_DUPLICATE_', nthInput, edge)
}
