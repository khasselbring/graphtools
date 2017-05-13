import * as Graph from '../api'
import * as Runtime from './runtime'

/**
 * Runs a benchmark function with multiple arguments
 * @param {function} func A benchmark function to run with various arguments
 * @param {string} logfile A filename of the file to store the results in
 * @param {string} header
 * @param {number} variant
 * @param {array} argsList An array of argument-arrays
 */
export function benchmark (func, logfile, header, variant, argsList) {
  var csvWriter = require('csv-write-stream')
  var fs = require('fs')
  var writer = csvWriter({ headers: [header, 'runtime[ms]', 'ms / x'] })
  var mkdirp = require('mkdirp')
  mkdirp('./benchmarkLogs/')
  writer.pipe(fs.createWriteStream('./benchmarkLogs/' + logfile))
  for (var ind in argsList) {
    var runtime = func.apply(func, argsList[ind])
    var x = argsList[ind][variant]
    writer.write([x, runtime, runtime / x])
  }
  writer.end()
}

/**
 * @param {function} func
 * @param {string} logfile
 * @param {string} header
 * @param {array} args
 * @param {number} variant
 * @param {number} from
 * @param {number} to
 * @param {number} steps
 */
export function benchmarkRange (func, logfile, header, args, variant, from, to, steps) {
  var argsList = []
  for (var i = from; i <= to; i += (to - from) / steps) {
    args.splice(variant, 1, Math.floor(i))
    argsList.push(args.slice() /* copy array */)
  }
  benchmark(func, logfile, header, variant, argsList)
}

export function benchmarkSearchingHashtable (entries, searches) {
  var obj = {}
  for (var i = 0; i < entries; i++) {
    obj[i] = i
  }
  var results = Runtime.executionTime(function () {
    Runtime.times(searches, function () {
      return obj[Math.floor(Math.random() * obj.length)]
    })
  })
  console.log(results.runtime)
  return results.runtime
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
  // TODO add return
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

function createDefaultGraph (nodes, edges) {
  var graph = addNodes(nodes)
  var edgeMap = getDefaultEdgeMap(edges, graph)
  graph = addEdgesMapped(edges, graph, edgeMap)
  return graph
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
