/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph.js'
import * as Edge from '../src/edge.js'
// import _ from 'lodash'

var expect = chai.expect

describe('Edge API', () => {
  it('Normalizes an edge correctly', () => {
    var graph = Graph.addNode(
      Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', type: 'output'}]}), {id: 'b', ports: [{name: 'out', type: 'input'}]}), {id: 'P', ports: [{name: 'out', type: 'output'}]})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', outPort: 'out', inPort: 'in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', layer: 'dataflow'})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', fromPort: 'out', toPort: 'in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: undefined, layer: 'dataflow'})
    expect(Edge.normalize(graph, {from: 'a@out', to: 'b@in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: undefined, layer: 'dataflow'})
  })

  it('Can handle parents correctly', () => {
    var graph = Graph.addNode(
      Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', type: 'output'}]}), {id: 'b', ports: [{name: 'out', type: 'input'}]}), {id: 'P', ports: [{name: 'out', type: 'output'}]})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', outPort: 'out', inPort: 'in'}, 'P'))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: 'P', layer: 'dataflow'})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', fromPort: 'out', toPort: 'in', parent: 'P'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: 'P', layer: 'dataflow'})
  })

  it('Assigns the parent for ports if only the port name is given', () => {
    var graph = Graph.addNode(
      Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', type: 'output'}]}), {id: 'b', ports: [{name: 'out', type: 'input'}]}), {id: 'P', ports: [{name: 'out', type: 'output'}]})
    expect(Edge.normalize(graph, {from: '@out', to: 'b@in'}, 'P'))
      .to.eql({from: 'P', to: 'b', outPort: 'out', inPort: 'in', parent: 'P', layer: 'dataflow'})
  })

  it('is possible to set the layer explicitly', () => {
    var graph = Graph.addNode(
      Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', type: 'output'}]}), {id: 'b', ports: [{name: 'out', type: 'input'}]}), {id: 'P', ports: [{name: 'out', type: 'output'}]})
    expect(Edge.normalize(graph, {from: '@out', to: 'b@in', layer: 'errorHandling'}, 'P'))
      .to.eql({from: 'P', to: 'b', outPort: 'out', inPort: 'in', parent: 'P', layer: 'errorHandling'})
  })

  var cmpGraph =
    Graph.addNode(Graph.addNode(
    Graph.addNode(
    Graph.addNode(
      Graph.empty(), {id: 'inc', ports: [{name: 'i', type: 'input'}, {name: 'inc', type: 'output'}]}),
      {id: 'add', ports: [{name: 's1', type: 'input'}, {name: 's2', type: 'input'}, {name: 'sum', type: 'output'}], parent: 'inc'}),
      {id: 'stdout', ports: [{name: 'input', type: 'input'}]}),
      {id: 'const', ports: [{name: 'output', type: 'output'}], parent: 'inc'})
  it('automatically assigns the correct parent to the edge', () => {
    expect(Edge.normalize(cmpGraph, {from: 'inc@inc', to: 'stdout@input'}).parent).to.be.undefined
    expect(Edge.normalize(cmpGraph, {from: 'inc@i', to: 'add@s1'}).parent).to.equal('inc')
    expect(Edge.normalize(cmpGraph, {from: 'const@output', to: 'add@s2'}).parent).to.equal('inc')
    expect(Edge.normalize(cmpGraph, {from: 'add@sum', to: 'inc@inc'}).parent).to.equal('inc')
  })
})
