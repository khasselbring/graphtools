import * as Graph from '../api'
import * as Runtime from './runtime'

const Node = Graph.Node

export function addNodes (n, graph = Graph.empty()) {
  graph = Runtime.timesIntermediate(n, function (graph) {
    return Graph.addNode({}, graph)
  })(Graph.empty())

  return graph
}

export function addEdges (n, graph = Graph.empty()) {
  var nodes = Graph.nodes(graph)
  var nodesOut = nodes.filter(function (node) {
    return Node.outputPorts(node).length > 0
  })
  var nodesIn = nodes.filter(function (node) {
    return Node.inputPorts(node).length > 0
  })
  if (nodesOut.length < 1) {
    graph = Graph.addNode({ports: [{port: 'out', kind: 'output', type: 'Number'}]}, graph)
    nodesOut.push(graph)
  }
  if (nodesIn.length < 1) {
    graph = Graph.addNode({ports: [{port: 'in', kind: 'output', type: 'Number'}]}, graph)
    nodesIn.push(graph)
  }
  for (var i = 0; i < n; i++) {
    var nodeOut = nodesOut[Math.floor(Math.random() * nodesOut.length)]
    var nodeIn = nodesIn[Math.floor(Math.random() * nodesIn.length)]
    graph = Graph.addEdge({ from: nodeOut.id, to: nodeIn.id }, graph)
  }
}
