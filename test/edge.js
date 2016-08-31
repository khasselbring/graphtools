/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph.js'
import * as Edge from '../src/edge.js'
import * as Node from '../src/node'
import _ from 'lodash'

var expect = chai.expect

describe.only('Edge API', () => {
  it('Normalizes an edge correctly', () => {
    var cmpd = Graph.compound({id: 'P', ports: [{name: 'out', kind: 'output', type: 'a'}]})
    var graph = Graph.empty()
      .addNode(cmpd)
      .addNode({id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      .addNode({id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
    const normEdge1 = Edge.normalize(graph, {from: 'a', to: 'b', outPort: 'out', inPort: 'in'})
    const normEdge2 = Edge.normalize(graph, {from: 'a', to: 'b', fromPort: 'out', toPort: 'in'})
    const normEdge3 = Edge.normalize(graph, {from: 'a@out', to: 'b@in'})
    expect(_.omit(normEdge1, 'parent'))
      .to.eql({from: ['a'], to: ['b'], outPort: 'out', inPort: 'in', layer: 'dataflow'})
    expect(_.omit(normEdge2, 'parent'))
      .to.eql({from: ['a'], to: ['b'], outPort: 'out', inPort: 'in', layer: 'dataflow'})
    expect(_.omit(normEdge3, 'parent'))
      .to.eql({from: ['a'], to: ['b'], outPort: 'out', inPort: 'in', layer: 'dataflow'})
  })

  it('Can handle parents correctly', () => {
    var cmpd = Graph.compound({id: 'P', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      .addNode({id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      .addNode({id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      .addEdge({from: 'a@out', to: 'b@in'})
    var graph = Graph.empty().addNode(cmpd)
    var cmpdEdge = graph.node('P').edges()[0]
    expect(cmpdEdge)
      .to.eql({from: ['a'], to: ['b'], outPort: 'out', inPort: 'in', layer: 'dataflow', parent: ['P']})
  })

  it('Assigns the parent for ports if only the port name is given', () => {
    var cmpd = Graph.compound({id: 'P', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      .addNode({id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      .addNode({id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
    const normEdge = Edge.normalize(cmpd, {from: '@out', to: 'b@in'})
    expect(_.omit(normEdge, 'parent'))
      .to.eql({from: [], to: ['b'], outPort: 'out', inPort: 'in', layer: 'dataflow', innerCompoundOutput: true})
    expect(Node.equal(normEdge.parent, cmpd)).to.be.true
  })

  it('updates the paths when a compound is added into another graph', () => {
    var cmpd1 = Graph.compound({id: 'P', ports: [{name: 'out', kind: 'input', type: 'a'}]})
      .addNode({id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      .addNode({id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      .addEdge({from: '@out', to: 'b@in'})
    var cmpd2 = Graph.compound({id: 'P2', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      .addNode(cmpd1)
    expect(Graph.edges(cmpd2.node('P'))[0]).to.eql({from: ['P2', 'P'], to: ['P2', 'P', 'b'], outPort: 'out', inPort: 'in',
        layer: 'dataflow', innerCompoundOutput: true, parent: ['P2', 'P']})
  })
})
