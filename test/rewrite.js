/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph'
import {includePredecessor} from '../src/rewrite/compound'

var expect = chai.expect

describe.only('Rewrite basic API', () => {
  it('can include the direct predecessor of a compound port into the compound', () => {
    var comp = Graph.addEdge({from: '@inC', to: '@outC'},
      Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
    var graph = Graph.chain(
      Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'inA', kind: 'input'}], componentId: 'moved'}),
      Graph.addNode(comp),
      Graph.addNode({ports: [{port: 'outF', kind: 'output'}]}),
      (graph, objs) =>
        Graph.addEdge({from: objs()[0].id + '@outA', to: objs()[1].id + '@inC'})(graph),
      (graph, objs) =>
        Graph.addEdge({from: objs()[2].id + '@outF', to: objs()[0].id + '@inA'})(graph)
    )()
    expect(Graph.nodes(graph)).to.have.length(3)
    expect(Graph.nodes(Graph.node('c', graph))).to.have.length(0)
    var rewGraph = includePredecessor({node: 'c', port: 'inC'}, graph)
    expect(Graph.nodes(rewGraph)).to.have.length(2)
    expect(Graph.nodes(Graph.node('c', rewGraph))).to.have.length(1)
    expect(Graph.inIncidents('c', rewGraph)).to.have.length(2)
    expect(Graph.node(Graph.predecessor('c@outC', rewGraph), rewGraph).componentId).to.equal('moved')
  })
})
