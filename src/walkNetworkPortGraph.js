
import _ from 'lodash'

export var successor = (graph, node, port) =>
    _(graph.edges())
      .filter((e) => e.v === node)
      .filter((e) => graph.edge(e).outPort === port)
      .map((e) => ({node: e.w, port: graph.edge(e).inPort, edge: {from: e.v, to: e.w, outPort: graph.edge(e).outPort, inPort: graph.edge(e).inPort}}))
      .value()

export var predecessor = (graph, node, port) =>
  _(graph.edges())
    .filter((e) => e.w === node)
    .filter((e) => graph.edge(e).inPort === port)
    .map((e) => ({node: e.v, port: graph.edge(e).outPort, edge: {from: e.v, to: e.w, outPort: graph.edge(e).outPort, inPort: graph.edge(e).inPort}}))
    .value()
