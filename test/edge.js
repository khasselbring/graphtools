/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph.js'
import * as Edge from '../src/edge.js'
// import _ from 'lodash'

var expect = chai.expect

describe.only('Edge API', () => {
  it('Normalizes an edge correctly', () => {
    var graph = Graph.addNode(
      Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a'}), {id: 'b'}, {id: 'P'}))
    expect(Edge.normalize(graph, {from: 'a', to: 'b', outPort: 'out', inPort: 'in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in'})
    expect(Edge.normalize(graph, {from: 'a', to: 'b', fromPort: 'out', toPort: 'in'}))
      .to.eql({from: 'a', to: 'b', outPort: 'out', inPort: 'in'})
  })
})
