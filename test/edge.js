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
        Graph.addNode(Graph.empty(), {id: 'a'}), {id: 'b'}), {id: 'P'})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', outPort: 'out', inPort: 'in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in'})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', fromPort: 'out', toPort: 'in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: undefined})
    expect(Edge.normalize(graph, {from: 'a@out', to: 'b@in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: undefined})
  })

  it('Can handle parents correctly', () => {
    var graph = Graph.addNode(
      Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a'}), {id: 'b'}), {id: 'P'})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', outPort: 'out', inPort: 'in'}, 'P'))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: 'P'})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', fromPort: 'out', toPort: 'in', parent: 'P'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in', parent: 'P'})
  })

  it('Assigns the parent for ports if only the port name is given', () => {
    var graph = Graph.addNode(
      Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a'}), {id: 'b'}), {id: 'P'})
    expect(Edge.normalize(graph, {from: '@out', to: 'b@in'}, 'P'))
      .to.eql({from: 'P', to: 'b', outPort: 'out', inPort: 'in', parent: 'P'})
  })
})
