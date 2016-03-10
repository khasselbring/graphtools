
import _ from 'lodash'

export function backtrackPortGraph (graph, node, fn) {
  var getPredecessors = () =>
    _([])
      .map((e) => e.v)
  return backtrack(graph, node, fn, getPredecessors)
}

export function backtrackNetworkGraph (graph, node, fn) {
  var getPredecessors = (cur) =>
    _([])
      .filter((e) => e.v === cur.node + '_PORT_' + cur.port)
      .map((e) => graph.predecessors(e.v))
      .flatten()
      .map((e) => graph.predecessors(e))
      .flatten()
  return backtrack(graph, node, fn, getPredecessors)
}

function backtrack (graph, node, fn, predecessor) {
  // inPorts [ {port: name, payload: ?}]
  var inPorts = fn(graph.node(node), undefined)
  var callStack = _.map(inPorts, (portData) => ({node: node, port: portData.port, payload: portData.payload}))
  while (callStack.length !== 0) {
    var cur = callStack.pop()
    var inEdges = graph.inEdges(cur.node)
    var inNodes = predecessor(cur).plant(inEdges).value()
    var newCallStackElements = _.map(inNodes, (n) => {
      var result = fn(graph.node(n), cur.payload)
      return _.map(result, (res) => ({node: n, port: res.port, payload: res.payload}))
    })
    callStack = _.concat(callStack, _.flatten(newCallStackElements))
  }
}
