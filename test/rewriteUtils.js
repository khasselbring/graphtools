/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph'
import * as Utils from './sampleQueries'

const expect = chai.expect

describe('Exemplary usages', () => {
  it('can delete non-branching predecessors', () => {
    var graph = Graph.empty()
      .addNode({id: 'A', ports: [{name: 'a', kind: 'output'}]})
      .addNode({id: 'B', ports: [{name: 'b', kind: 'input'}, {name: 'c', kind: 'output'}]})
      .addNode({id: 'C', ports: [{name: 'd', kind: 'input'}, {name: 'e', kind: 'output'}]})
      .addNode({id: 'D', ports: [{name: 'f', kind: 'input'}]})
      .addEdge({from: 'A@a', to: 'B@b'})
      .addEdge({from: 'B@c', to: 'C@d'})
      .addEdge({from: 'C@e', to: 'D@f'})
    var newGraph = Utils.deepRemove(graph, 'C')
    expect(newGraph.nodes()).to.have.length(1)
    expect(newGraph.hasNode('D')).to.be.true
    expect(newGraph.hasNode('A')).to.be.false
    var newGraph2 = Utils.deepRemove(graph, 'B')
    expect(newGraph2.nodes()).to.have.length(2)
    expect(newGraph.hasNode('D')).to.be.true
    expect(newGraph.hasNode('C')).to.be.true
    expect(newGraph.hasNode('A')).to.be.false
  })
})
