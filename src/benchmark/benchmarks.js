import * as Graph from '../api'
import * as Runtime from './runtime'

const Node = Graph.Node

function addNodes (n, graph = Graph.empty()) {
  graph = Runtime.timesIntermediate(n, function (graph) {
    return Graph.addNode({ ports: [{ port: 'out', kind: 'output', type: 'Number' }, { port: 'in', kind: 'input', type: 'Number' }] }, graph)
  })(Graph.empty())
  return graph
}

export function benchmarkAddNodes (n) {
  var results = Runtime.executionTime(function () {
    return addNodes(n)
  })
  console.log('Adding ' + n + '\t nodes in ' + results.runtime + 'ms')
  return results.runtime
}

function findNodes (n, graph = Graph.empty()) {
  var nodes = Graph.nodes(graph)
  if (nodes.length < 10) {
    graph = addNodes(10 - nodes.length)
  }

  for (var i = 0; i < n; i++) {
    var node = nodes[Math.floor(Math.random() * nodes.length)]
    Graph.node(node.id, graph)
  }
  // TODO add return
}

export function benchmarkFindNodes (nodes, find) {
  const graph = addNodes(nodes)
  const results = Runtime.executionTime(function () {
    findNodes(find, graph)
  })
  console.log('Finding a node in ' + nodes + '\t nodes ' + find + '\t times in ' + results.runtime + 'ms')
  return results.runtime
}

function addEdges (n, graph = Graph.empty()) {
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
  // TODO add return
}

/**
 * TODO
 * @param {*} n TODO
 * @param {*} graph TODO
 * @param {node => node} An Object that maps every node of the graph to a different node to create an edge to
 */
function addEdgesMapped (n, graph, edgeMap) {
  for (var e in edgeMap) {
    if (edgeMap.hasOwnProperty(e)) {
      graph = Graph.addEdge({ from: e + '@out', to: edgeMap[e] + '@in' }, graph)
    }
  }
  return graph
}

export function benchmarkAddEdgesMapped (nodes, edges) {
  var graph = addNodes(nodes)
  var edgeMap = getDefaultEdgeMap(edges, graph)
  var results = Runtime.executionTime(function () {
    return addEdgesMapped(edges, graph, edgeMap)
  })
  console.log('Adding ' + edges + '\t edges to ' + nodes + '\t nodes in ' + results.runtime + 'ms')
  return results.runtime
}

function getDefaultEdgeMap (edges, graph) {
  var edgeMap = {}
  var nodeList = Graph.nodes(graph)
  for (var i = 0; i < nodeList.length && i < edges; i++) {
    edgeMap[nodeList[i].id] = nodeList[(i + 1) % nodeList.length].id
  }
  return edgeMap
}

function createDefaultGraph (nodes, edges) {
  var graph = addNodes(nodes)
  var edgeMap = getDefaultEdgeMap(edges, graph)
  graph = addEdgesMapped(edges, graph, edgeMap)
  return graph
}

function checkConnected (n, graph, edgeMap) {
  for (var e in edgeMap) {
    if (edgeMap.hasOwnProperty(e)) {
      graph = Graph.areConnected(e, edgeMap[e], graph)
    }
  }
}

export function benchmarkCheckConnected (nodes, edges, times) {
  var graph = createDefaultGraph(nodes, edges)
  var nodeList = Graph.nodes(graph)
  var edgeMap = {}
  for (var i = 0; i < times; i++) {
    edgeMap[nodeList[Math.floor(Math.random() * nodeList.length)].id] = nodeList[Math.floor(Math.random() * nodeList.length)].id
  }
  const results = Runtime.executionTime(function () {
    return checkConnected(times, graph, edgeMap)
  })
  console.log('Checking ' + times + '\t connections in ' + nodes + '\t nodes with ' + edges + '\t edges in ' + results.runtime + 'ms')
}
