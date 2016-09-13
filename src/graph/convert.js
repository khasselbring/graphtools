
import concat from 'lodash/fp/concat'
import cloneDeep from 'lodash/fp/cloneDeep'
import {empty} from './basic'
import {addNode} from './node'
import {addEdge} from './edge'
import {addComponent} from './component'

/**
 * Adds the API to the JSON document to work with the graph.
 * @param {object} jsonGraph The json representing the port graph.
 * @returns {PortGraph} The port graph with its functions.
 */
export function fromJSON (jsonGraph) {
  var nodes = concat(jsonGraph.Nodes || [], (Array.isArray(jsonGraph.nodes)) ? jsonGraph.nodes : [])
  var edges = concat(jsonGraph.Edges || [], (Array.isArray(jsonGraph.edges)) ? jsonGraph.edges : [])
  var components = concat(jsonGraph.Components || [], (Array.isArray(jsonGraph.components)) ? jsonGraph.components : [])
  jsonGraph.nodes = nodes
  jsonGraph.edges = edges
  jsonGraph.components = components
  delete jsonGraph.Nodes
  delete jsonGraph.Edges
  delete jsonGraph.Components
  var graph = empty()
  jsonGraph.nodes.reduce((curGraph, node) => addNode(node, curGraph), graph)
  jsonGraph.edges.reduce((curGraph, edge) => addEdge(edge, curGraph), graph)
  jsonGraph.components.reduce((curGraph, comp) => addComponent(comp, curGraph), graph)
  // add parents ? optimizations!!
  return graph
}

/**
 * Returns a JSON object for the graph
 * @param {PortGraph} graph The graph to convert
 * @returns {object} A JSON representation of the graph.
 */
export function toJSON (graph) {
  // var exportGraph = removeGraphInternals(graph)
  return cloneDeep(graph)
}
