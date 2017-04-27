import * as Graph from '../api'
import * as Runtime from './runtime'

const Node = Graph.Node

export function addNodes (n, graph = Graph.empty()) {
  graph = Runtime.timesIntermediate(n, function (graph) {
    return Graph.addNode({ ports: [{ port: 'out', kind: 'output', type: 'Number' }, { port: 'in', kind: 'input', type: 'Number' }] }, graph)
  })(Graph.empty())

  return graph
}

export function benchmarkAddNodes (n) {
  var results = Runtime.executionTime(function () {
    return addNodes(n)
  })
  console.log('Adding ' + n + ' nodes in ' + results.runtime + 'ms')
  return results.runtime
}

export function findNode (n, graph = Graph.empty()) {
  var nodes = Graph.nodes(graph)
  if (nodes.length < 10) {
    graph = addNodes(10 - nodes.length)
  }

  for (var i = 0; i < n; i++) {
    var node = nodes[Math.floor(Math.random() * nodes.length)]
    Graph.node(node.id, graph)
  }
}

export function benchmarkFindNode (nodes, find) {
  const graph = addNodes(nodes)
  const results = Runtime.executionTime(function () {
    findNode(find, graph)
  })
  console.log('Finding node in ' + nodes + ' nodes ' + find + ' times in ' + results.runtime + 'ms')
  return results.runtime
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
    graph = Graph.addNode({ports: [{port: 'in', kind: 'input', type: 'Number'}]}, graph)
    nodesIn.push(graph)
  }
  for (var i = 0; i < n; i++) {
    var nodeOut = nodesOut[Math.floor(Math.random() * nodesOut.length)]
    var nodeIn = nodesIn[Math.floor(Math.random() * nodesIn.length)]
    graph = Graph.addEdge({ from: nodeOut.id + '@out', to: nodeIn.id + '@in' }, graph)
    nodesOut.splice(nodesOut.indexOf(nodeOut), 1)
    nodesIn.splice(nodesIn.indexOf(nodeIn), 1)
  }
}

export function benchmarkAddEdges (nodes, edges) {
  const graph = addNodes(nodes)
  const results = Runtime.executionTime(function () {
    return addEdges(edges, graph)
  })
  console.log('Adding ' + edges + ' edges to ' + nodes + ' nodes in ' + results.runtime + 'ms')
}
