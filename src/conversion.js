/** @module Conversion */

import grlib from 'graphlib'
import * as Graph from './graph'
import * as Node from './node'
import * as Edge from './edge'
import * as CS from './changeSet'
import _ from 'lodash'

function mapToGrlibPort (port) {
  return [port.name, port.type]
}

function mapToGrlibNode (node) {
  return {
    v: node.id,
    value: _.merge({
      inputPorts: _(Node.inputPorts(node))
        .map(mapToGrlibPort)
        .fromPairs()
        .value(),
      outputPorts: _(Node.outputPorts(node))
        .map(mapToGrlibPort)
        .fromPairs()
        .value(),
      id: node.meta,
      branchPath: node.id
    }, _.omit(node, ['id', 'ports']))
  }
}

function mapToGrlibEdges (edge) {
  return {
    v: edge.from, w: edge.to,
    label: `${edge.from}@${edge.outPort}→${edge.to}@${edge.inPort}`,
    value: { outPort: edge.outPort, inPort: edge.inPort }
  }
}

/**
 * Converts a graphlib graph into the corresponding port graph
 * @param {PortGraph} portGraph The graph instance as a port graph.
 * @returns {Graphlib} The given graph as an graphlib object.
 */
export function toGraphlib (portGraph) {
  var graph = {
    options: {directed: true, compound: true, multigraph: true},
    nodes: _.map(portGraph.Nodes, mapToGrlibNode),
    edges: _.map(portGraph.Edges, mapToGrlibEdges)
  }
  return grlib.json.read(graph)
}

function mapToPortPort (type, name, kind) {
  return {name, kind, type}
}

function mapToPortNodePorts (node) {
  const mapIns = _.partial(mapToPortPort, _, _, 'input')
  const mapOuts = _.partial(mapToPortPort, _, _, 'output')
  return _.concat(
    _.map(node.inputPorts, mapIns),
    _.map(node.outputPorts, mapOuts)
  )
}

function replacePorts (node) {
  return _.merge({}, _.omit(node.value, ['outputPorts', 'inputPorts', 'id']),
    {
      ports: mapToPortNodePorts(node.value),
      meta: node.value.id
    })
}

function mapToPortNode (node) {
  if (node.v.indexOf('defco_') === 0) {
    return CS.insertComponent(_.merge({}, replacePorts(node), {meta: node.v.slice('defco_'.length)}))
  }
  return CS.insertNode(_.merge({id: node.v}, replacePorts(node)))
}

function mapToPortEdges (graph, edge) {
  return CS.insertEdge(
    Edge.normalize(graph, {from: edge.v, to: edge.w, outPort: edge.value.outPort, inPort: edge.value.inPort, layer: 'dataflow'}))
}

/**
 * Converts a graphlib graph into a port graph.
 * @param {Graphlib} graph The graph object in graphlib format.
 * @returns {PortGraph} The given graph as a port graph.
 */
export function fromGraphlib (graph) {
  var graphJSON = grlib.json.write(graph)
  var nodeCS = _.map(graphJSON.nodes, mapToPortNode)
  var nodeGraph = CS.applyChangeSets(Graph.empty(), nodeCS)
  var edgeCS = _.map(graphJSON.edges, _.partial(mapToPortEdges, nodeGraph))
  return CS.applyChangeSets(nodeGraph, edgeCS)
}
