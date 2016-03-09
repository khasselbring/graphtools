
import _ from 'lodash'

export default function backtrack (graph, node, fn) {
  // inPorts [ {port: name, payload: ?}]
  var inPorts = fn(graph.node(node), undefined)
  var callStack = _.map(inPorts, (portData) => ({node: node, port: portData.port, payload: portData.payload}))
  while (callStack.length !== 0) {
    var cur = callStack.pop()
    var inEdges = graph.inEdges(cur.node)
    var portEdges = _.filter(inEdges, (e) => e.v === cur.node + '_PORT_' + cur.port)
    var inNodes = _(portEdges)
      .map((e) => graph.predecessors(e.v))
      .flatten()
      .map((e) => graph.predecessors(e))
      .flatten()
      .value()
    var newCallStackElements = _.map(inNodes, (n) => {
      var result = fn(graph.node(n), cur.payload)
      return _.map(result, (port) => ({node: n, port: port}))
    })
    callStack = _.concat(callStack, _.flatten(newCallStackElements))
  }
}
