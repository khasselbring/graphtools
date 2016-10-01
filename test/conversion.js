/* global describe, it */

import chai from 'chai'
import * as Convert from '../src/conversion'
import * as Graph from '../src/graph'
import * as Node from '../src/node'
import grlib from 'graphlib'
// import _ from 'lodash'

var expect = chai.expect

describe.skip('Graphlib Conversion API', () => {
  it('can convert nodes with ports', () => {
    var graph = new grlib.Graph({multigraph: true, directed: true, compound: true})
    graph.setNode('name', {inputPorts: {a: 'string'}, outputPorts: {b: 'number'}, atomic: true})
    var conv = Convert.fromGraphlib(graph)
    expect(Graph.nodeNames(conv)).to.eql(['name'])
    expect(Node.hasPort('a', Graph.node(conv, 'name'))).to.be.true
    expect(Node.hasPort('b', Graph.node(conv, 'name'))).to.be.true
    expect(Node.inputPorts(Graph.node(conv, 'name'))).to.have.length(1)
    expect(Node.outputPorts(Graph.node(conv, 'name'))).to.have.length(1)
  })

  it('converts edges in graphlib graphs', () => {
    var graph = new grlib.Graph({multigraph: true, directed: true, compound: true})
    graph.setNode('from', {outputPorts: {b: 'string'}, atomic: true})
    graph.setNode('to', {inputPorts: {a: 'string'}, atomic: true})
    graph.setEdge({v: 'from', w: 'to'}, {outPort: 'b', inPort: 'a'})
    var conv = Convert.fromGraphlib(graph)
    expect(Graph.edges(conv)).to.have.length(1)
    expect(Graph.hasEdge(conv, {from: 'from', to: 'to', outPort: 'b', inPort: 'a'})).to.be.true
  })

  it('finds defco_ components', () => {
    var graph = new grlib.Graph({multigraph: true, directed: true, compound: true})
    graph.setNode('defco_fn', {outputPorts: {b: 'string'}, implementation: {}, version: '0.0.0'})
    var conv = Convert.fromGraphlib(graph)
    expect(Graph.nodes(conv)).to.have.length(0)
    expect(Graph.components(conv)).to.have.length(1)
    expect(Graph.hasComponent(conv, 'fn')).to.be.true
  })

  it('creates a bijective mapping between port graphs and graphlib', () => {
    var graph = new grlib.Graph({multigraph: true, directed: true, compound: true})
    graph.setNode('from', {outputPorts: {b: 'string'}, atomic: true})
    graph.setNode('to', {inputPorts: {a: 'string'}, atomic: true})
    graph.setEdge({v: 'from', w: 'to'}, {outPort: 'b', inPort: 'a'})
    var conv = Convert.toGraphlib(Convert.fromGraphlib(graph))
    expect(conv.nodes().length).to.equal(graph.nodes().length)
    expect(conv.edges().length).to.equal(graph.edges().length)
  })
})
