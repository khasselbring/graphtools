/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph'
import {includePredecessor} from '../src/rewrite/compound'

var expect = chai.expect

describe.skip('Rewrite basic API', () => {
  it('can include the direct predecessor of a compound port into the compound', () => {
    var comp = Graph.addEdge({from: '@inC', to: '@outC'},
      Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
    var graph = Graph.chain(
      Graph.addNode({ports: [{port: 'outA', kind: 'output'}]}),
      Graph.addNode(comp)
    )()
    expect(Graph.nodes(graph)).to.have.length(2)
    expect(Graph.nodes(Graph.node('c', graph))).to.have.length(0)
    var rewGraph = includePredecessor({node: 'c', port: 'inC'}, graph)
    expect(Graph.nodes(rewGraph)).to.have.length(1)
    expect(Graph.nodes(Graph.node('c', rewGraph))).to.have.length(1)
  })
})
