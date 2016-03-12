
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
  var inPorts = fn(node, graph.node(node), undefined)
  var callStack = _.map(inPorts, (portData) => ({node: node, port: portData.port, payload: portData.payload, path: [node]}))
  var endPoints = []
  while (callStack.length !== 0) {
    var cur = callStack.pop()
    console.log(cur)
    var inEdges = graph.inEdges(cur.node)
    var inNodes = predecessor(cur).plant(inEdges).value()
    var newCallStackElements = _(inNodes)
      .map((n) => {
        var result = fn(n, graph.node(n), cur.payload)
        console.log(result)
        return _.map(result, (res) => ({node: n, port: res.port, payload: res.payload, path: _.concat(cur.path, n)}))
      })
      .flatten()
      .value()
    if (newCallStackElements.length === 0) {
      endPoints.push(cur)
    }
    callStack = _.concat(callStack, newCallStackElements)
  }
  return endPoints
}
