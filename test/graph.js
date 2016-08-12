/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet'
import * as Graph from '../src/graph'
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

  it('clones a graph', () => {
    var graph = Graph.empty()
    graph.arr = []
    var newGraph = Graph.clone(graph)
    newGraph.arr.push(1)
    expect(graph.arr).to.have.length(0)
    expect(newGraph.arr).to.have.length(1)
  })

  it('imports a graph from json', () => {
    var graph = {
      Nodes: [{id: 'a', ports: [{name: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{name: 'b', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{meta: 'c', version: '0.1.0', ports: [{name: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(Graph.fromJSON(graph)).to.be.ok
  })

  it('fails if the json graph is not valid', () => {
    var graph1 = {
      Nodes: [{id: 'a', ports: [{name: 'b', koind: 'output', type: 'c'}]}, {id: 'b', ports: [{name: 'b', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{meta: 'c', version: '0.1.0', ports: [{name: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph1)).to.throw(Error)
    var graph2 = {
      Nodes: [{id: 'a', ports: [{name: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{name: 'c', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{meta: 'c', version: '0.1.0', ports: [{name: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph2)).to.throw(Error)
  })

  describe('Node functions', () => {
    it('fails if a non existend node is queried', () => {
      expect(() => Graph.node(Graph.empty(), 'a')).to.throw(Error)
    })

    it('get all nodes', () => {
      var graph = changeSet.applyChangeSets(Graph.empty(), [
        changeSet.insertNode({id: 'a'}),
        changeSet.insertNode({id: 'b'})
      ])
      expect(Graph.nodes(graph)).to.have.length(2)
    })

    it('supports a predicate function for node selection', () => {
      var graph = changeSet.applyChangeSets(Graph.empty(), [
        changeSet.insertNode({id: 'a0'}),
        changeSet.insertNode({id: 'b1'}),
        changeSet.insertNode({id: 'a1'})
      ])
      expect(Graph.nodes(graph, (n) => n.id.indexOf('a') === 0)).to.have.length(2)
    })

    it('adds nodes to the graph', () => {
      var graph = Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      expect(Graph.hasNode(graph, 'a')).to.be.true
    })

    it('can chain adding nodes', () => {
      var graph = Graph.empty()
        .addNode({id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]})
        .addNode({id: 'b', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      expect(graph.nodes()).to.have.length(2)
    })

    it('should throw an error if the node data is not valid', () => {
      expect(() => Graph.addNode(Graph.empty())).to.throw(Error)
      expect(() => Graph.addNode(Graph.empty(), {})).to.throw(Error)
    })

    it('should throw an error if an node gets added twice', () => {
      var graph = Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      expect(() => Graph.addNode(graph, {id: 'a', prop: 'p'})).to.throw(Error)
    })

    it('can set the parent of a node', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      Graph.setParent(graph, 'b', 'a')
      expect(Graph.node(graph, 'b').parent).to.equal('a')
    })

    it('can check whether a node exists in the graph', () => {
      var graph = changeSet.applyChangeSets(Graph.empty(), [
        changeSet.insertNode({id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]}),
        changeSet.insertNode({id: 'b', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      ])
      expect(Graph.hasNode(graph, 'a')).to.be.true
      expect(Graph.hasNode(graph, {id: 'b'})).to.be.true
    })
  })

  describe('Edge functions', () => {
    it('Can add edges to the graph', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      var newGraph = Graph.addEdge(graph, {from: 'a@out', to: 'b@in'})
      expect(Graph.edges(newGraph)).to.have.length(1)
      expect(Graph.edges(newGraph)[0].from).to.equal('a')
      expect(Graph.edges(newGraph)[0].outPort).to.equal('out')
      expect(Graph.edges(newGraph)[0].to).to.equal('b')
      expect(Graph.edges(newGraph)[0].inPort).to.equal('in')
    })

    it('Throws an error if at least one node in the edge does not exist', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'N@out', to: 'b@in'}))
        .to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@out', to: 'N@in'}))
        .to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'N@out', to: 'M@in'}))
        .to.throw(Error)
    })

    it('Throws an error if the edge is a loop', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'b@in', to: 'b@in'}))
        .to.throw(Error)
    })

    it('Throws an error if the edge goes from output to output', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'a@out', to: 'b@out'}))
        .to.throw(Error)
    })

    it('Check whether an edge is in the graph', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      var newGraph = Graph.addEdge(graph, {from: 'a@out', to: 'b@in'})
      expect(Graph.hasEdge(graph, {from: 'a@out', to: 'b@in'})).to.be.false
      expect(Graph.hasEdge(newGraph, {from: 'a@out', to: 'b@in'})).to.be.true
    })

    it('Get an edge in the graph', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
        .addNode({id: 'c', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      var newGraph = Graph.addEdge(graph, {from: 'a@out', to: 'b@in', parent: 'c'})
      expect(Graph.edge(newGraph, {from: 'a@out', to: 'b@in'})).to.be.ok
      expect(Graph.edge(newGraph, {from: 'a@out', to: 'b@in'}).parent).to.equal('c')
      expect(() => Graph.edge(graph, {from: 'a@out', to: 'b@in'})).to.throw(Error)
    })

    it('Can get the parent of an edge', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
        .addNode({id: 'c', ports: [{name: 'out', kind: 'output', type: 'a'}]})
      var newGraph = Graph.addEdge(graph, {from: 'a@out', to: 'b@in', parent: 'c'})
      expect(Graph.edgeParent(newGraph, {from: 'a@out', to: 'b@in'})).to.equal('c')
    })

    it('Fails if the connecting ports do not exist', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'a@no', to: 'b@in', parent: 'a'})).to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@out', to: 'b@no', parent: 'a'})).to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@no', to: 'b@no', parent: 'a'})).to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@in', to: 'b@out', parent: 'a'})).to.throw(Error)
    })
  })

  describe('Meta information', () => {
    it('returns a map of all meta information', () => {
      var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.addMetaInformation({a: 'b'}))
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal('b')
    })
  })
})
