import * as Graph from '../api'
import * as Runtime from './runtime'

function createDefaultGraph (nodes, edges) {
  var graph = addNodes(nodes)
  var edgeMap = getDefaultEdgeMap(edges, graph)
  graph = addEdgesMapped(edges, graph, edgeMap)
  return graph
}

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

function findNodes (n, graph = Graph.empty(), nodeList) {
  if (nodeList.length < 10) {
    graph = addNodes(10 - nodeList.length)
  }

  for (var i = 0; i < n; i++) {
    var node = nodeList[Math.floor(Math.random() * nodeList.length)]
    Graph.node(node.id, graph)
  }
  return graph
}

export function benchmarkFindNodes (nodes, find) {
  const graph = addNodes(nodes)
  var nodeList = Graph.nodes(graph)
  const results = Runtime.executionTime(function () {
    findNodes(find, graph, nodeList)
  })
  console.log('Finding a node in ' + nodes + '\t nodes ' + find + '\t times in ' + results.runtime + 'ms')
  return results.runtime
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

function checkConnected (graph, edgeMap) {
  var connected = []
  for (var e in edgeMap) {
    connected.push(Graph.areConnected(e.key, e.value, graph))
  }
  return connected
}

export function benchmarkCheckConnected (nodes, edges, times) {
  var graph = createDefaultGraph(nodes, edges)
  var nodeList = Graph.nodes(graph)
  var edgeMap = []
  for (var i = 0; i < times; i++) {
    var entry = {}
    entry.key = nodeList[Math.floor(Math.random() * nodeList.length)].id
    entry.value = nodeList[Math.floor(Math.random() * nodeList.length)].id
    edgeMap.push(entry)
  }
  const results = Runtime.executionTime(function () {
    return checkConnected(graph, edgeMap)
  })
  console.log('Checking ' + times + '\t connections in ' + nodes + '\t nodes with ' + edges + '\t edges in ' + results.runtime + 'ms')
  return results.runtime
}
