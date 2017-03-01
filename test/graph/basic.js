/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../../src/graph'
import {port} from '../../src/port'
import _ from 'lodash'
import semver from 'semver'

var expect = chai.expect

describe('Basic graph functions', () => {
  it('can create an empty graph', () => {
    var graph = Graph.empty()
    expect(Graph.nodes(graph)).to.have.length(0)
    expect(Graph.edges(graph)).to.have.length(0)
    expect(Graph.components(graph)).to.have.length(0)
    expect(_.keys(Graph.meta(graph))).to.have.length(1)
    expect(Graph.meta(graph)).to.have.property('version')
    expect(semver.valid(Graph.meta(graph).version)).to.be.ok
  })

  it.skip('clones a graph', () => {
    var graph = Graph.empty()
    graph.arr = []
    var newGraph = Graph.clone(graph)
    newGraph.arr.push(1)
    expect(graph.arr).to.have.length(0)
    expect(newGraph.arr).to.have.length(1)
    expect.fail('strange test...')
  })

  it('imports a graph from json', () => {
    var graphJSON = {
      id: '#id',
      nodes: [{id: '#a', ports: [{port: 'b', kind: 'output', type: 'a'}]}, {id: '#b', ports: [{port: 'b', kind: 'input', type: 'c'}]}],
      edges: [{from: {node: '#a', port: 'b'}, to: {node: '#b', port: 'b'}, layer: 'dataflow'}],
      components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    var graph = Graph.fromJSON(graphJSON)
    expect(graph).to.be.ok
    expect(Graph.nodes(graph)).to.have.length(2)
    expect(Graph.edgesDeep(graph)).to.have.length(1)
    expect(Graph.components(graph)).to.have.length(1)
  })

  it('fails if the json graph is not valid', () => {
    var graph1 = { // port in 'a' has the attribute 'koind' instead of 'kind'
      nodes: [{id: '#a', ports: [{port: 'b', koind: 'output', type: 'c'}]}, {id: '#b', ports: [{port: 'b', kind: 'input', type: 'c'}]}],
      edges: [{from: {node: '#a', port: 'b'}, to: {node: '#b', port: 'b'}, layer: 'dataflow'}],
      components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph1)).to.throw(Error)
    var graph2 = { // Edge targets a non existing port 'b@b'
      nodes: [{id: 'a', ports: [{port: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{port: 'c', kind: 'input', type: 'c'}]}],
      edges: [{from: 'a@b', to: 'b@b'}],
      components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph2)).to.throw(Error)
    var graph3 = { // Edge targets a non existing port 'b@b'
      nodes: [{id: 'a', ports: [{port: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{port: 'c', kind: 'input', type: 'c'}]}],
      edges: [{from: 'a@b', to: 'b@b', layer: 'dataflow'}],
      components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph3)).to.throw(Error)
  })

  it('can have edges between references', () => {
    var graph = Graph.flow(
      Graph.Let(
        [
          Graph.addNode({ref: 'a'}),
          Graph.addNode({ref: 'a'}),
        ], ([n1, n2], graph) =>
          Graph.addEdge({from: port(n1, 'a'), to: port(n2, 'other')}, graph)
      )
    )()
    expect(graph).to.be.ok
    expect(Graph.edgesDeep(graph)).to.have.length(1)
  })

  it('cannot add two nodes with the same name', () => {
    var graph = Graph.flow(Graph.addNode({ref: 'a', name: 'a'}))()
    expect(() => Graph.addNode({ref: 'a', name: 'a'}, graph)).to.throw(Error)
  })

  it('Gets all atomics in the graph', () => {
    var cmpd = Graph.flow(
      Graph.addNode({atomic: true, ports: [{port: 'a', kind: 'output', type: 'b'}]})
    )(Graph.compound({ports: [{port: 'a', kind: 'output', type: 'b'}]}))
    var graph = Graph.flow(
      Graph.addNode({atomic: true, ports: [{port: 'a', kind: 'output', type: 'b'}]}),
      Graph.addNode(cmpd)
    )()
    expect(Graph.atomics(graph)).to.have.length(2)
  })
})
