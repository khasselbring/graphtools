/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet'
import * as Graph from '../src/graph'
import * as Node from '../src/node'
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
    var graphJSON = {
      Nodes: [{id: 'a', ports: [{name: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{name: 'b', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{name: 'b', kind: 'output', type: 'c'}]}]
    }
    var graph = Graph.fromJSON(graphJSON)
    expect(graph).to.be.ok
    expect(graph.nodes()).to.have.length(2)
    expect(graph.edges()).to.have.length(1)
    expect(graph.components()).to.have.length(1)
  })

  it('importing JSON files is case insensitive', () => {
    var graphJSON = {
      nodes: [{id: 'a', ports: [{name: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{name: 'b', kind: 'input', type: 'c'}]}],
      edges: [{from: 'a@b', to: 'b@b'}],
      components: [{componentId: 'c', version: '0.1.0', ports: [{name: 'b', kind: 'output', type: 'c'}]}]
    }
    var graph = Graph.fromJSON(graphJSON)
    expect(graph).to.be.ok
    expect(graph.nodes()).to.have.length(2)
    expect(graph.edges()).to.have.length(1)
    expect(graph.components()).to.have.length(1)
  })

  it('fails if the json graph is not valid', () => {
    var graph1 = {
      Nodes: [{id: 'a', ports: [{name: 'b', koind: 'output', type: 'c'}]}, {id: 'b', ports: [{name: 'b', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{name: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph1)).to.throw(Error)
    var graph2 = {
      Nodes: [{id: 'a', ports: [{name: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{name: 'c', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{name: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph2)).to.throw(Error)
  })

  it('can have edges between references', () => {
    var graph = Graph.empty().addNode({ref: 'a', id: 'a'}).addNode({ref: 'a', id: 'b'})
      .addEdge({from: 'a@a', to: 'b@other'})
    expect(graph).to.be.ok
  })

  it('cannot add two nodes with the same id', () => {
    var graph = Graph.empty().addNode({ref: 'a', id: 'a'})
    expect(() => graph.addNode({ref: 'a', id: 'a'})).to.throw(Error)
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

    it('can check whether a node exists in the graph', () => {
      var graph = changeSet.applyChangeSets(Graph.empty(), [
        changeSet.insertNode({id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]}),
        changeSet.insertNode({id: 'b', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      ])
      expect(Graph.hasNode(graph, 'a')).to.be.true
      expect(Graph.hasNode(graph, {id: 'b'})).to.be.true
    })

    it('sets the path when creating compounds', () => {
      var impl = Graph.compound({id: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
      expect(impl.path).to.eql(['b'])
    })

    it('gets nodes by compound path', () => {
      var impl = Graph.compound({id: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode(impl)
      var n = Graph.node(graph, ['b', 'a'])
      expect(n).to.be.ok
      expect(n.id).to.equal('a')
      n = Graph.node(graph, '»b»a')
      expect(n).to.be.ok
      expect(n.id).to.equal('a')
    })

    it('does not confuse parent compounds and inner nodes', () => {
      var impl = Graph.compound({id: 'a', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode(impl)
      var n = Graph.node(graph, ['a', 'a'])
      expect(n).to.be.ok
      expect(n.id).to.equal('a')
      expect(n.path).to.eql(['a', 'a'])
      expect(n.atomic).to.be.true
    })

    it('checks nodes by compound path', () => {
      var impl = Graph.compound({id: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode(impl)
      expect(Graph.hasNode(graph, ['b', 'a'])).to.be.true
      expect(Graph.hasNode(graph, '»b»a')).to.be.true
      expect(Graph.hasNode(graph, ['a'])).to.be.false
      expect(Graph.hasNode(graph, ['a', 'b'])).to.be.false
    })

    it('adds nodes in compounds', () => {
      var impl = Graph.compound({id: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode(impl).addNodeByPath('b', {id: 'c', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      expect(Graph.hasNode(graph, ['b', 'a'])).to.be.true
      expect(Graph.hasNode(graph, ['b', 'c'])).to.be.true
    })

    it('gets nodes deep including compound nodes', () => {
      var impl = Graph.compound({id: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode(impl)
      var nodes = Graph.nodesDeep(graph)
      expect(nodes).to.have.length(2)
      expect(nodes.map((n) => Node.path(n))).to.have.deep.members([['b', 'a'], ['b']])
    })

    it('removes a node on the root level', () => {
      var graph = Graph.empty().addNode({id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      var remGraph = graph.removeNode('a')
      expect(remGraph).to.be.ok
      expect(remGraph.nodes()).to.have.length(0)
    })

    it('does not remove other nodes when removing a specific node', () => {
      var graph = Graph.empty().addNode({id: 'a', ports: [{name: 'p', kind: 'output', type: 'a'}]})
        .addNode({id: 'b', ports: [{name: 'p', kind: 'output', type: 'a'}]})
      var remGraph = graph.removeNode('a')
      expect(remGraph).to.be.ok
      expect(remGraph.nodes()).to.have.length(1)
      expect(remGraph.hasNode('a')).to.be.false
      expect(remGraph.hasNode('b')).to.be.true
    })

    it('removes nodes in compounds', () => {
      var impl = Graph.compound({id: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode(impl)
      var remGraph = graph.removeNode(['b', 'a'])
      expect(remGraph.hasNode('»b»a')).to.be.false
      expect(remGraph.hasNode('b')).to.be.true
    })

    it('only removes specified node in compound', () => {
      var impl = Graph.compound({id: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
        .addNode({id: 'b', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode(impl)
      var remGraph = graph.removeNode(['b', 'b'])
      expect(remGraph.hasNode('»b»a')).to.be.true
      expect(remGraph.hasNode('»b»b')).to.be.false
      expect(remGraph.hasNode('b')).to.be.true
    })

    it('replaces references with a node', () => {
      var graph = Graph.empty().addNode({ref: 'abc', id: '123'})
        .replaceNode('123', {componentId: 'abc', ports: [{name: 'a', kind: 'output', type: 'string'}], atomic: true})
      expect(graph.hasNode('123')).to.be.true
      expect(graph.Nodes).to.have.length(1)
      expect(graph.node('123').atomic).to.be.true
      expect(graph.node('123').componentId).to.equal('abc')
      expect(graph.node('123').ref).to.be.undefined
    })

    it('replaces references with a compound node', () => {
      var impl = Graph.compound({componentId: 'b', ports: [{name: 'out', kind: 'output', type: 'string'}]})
        .addNode({id: 'a', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
        .addNode({id: 'b', ports: [{name: 'in', kind: 'input', type: 'number'}], atomic: true})
      var graph = Graph.empty().addNode({ref: 'abc', id: '123'})
        .replaceNode('123', impl)
      expect(graph.hasNode('123')).to.be.true
      expect(graph.nodes()).to.have.length(1)
      expect(graph.nodesDeep()).to.have.length(3)
      expect(graph.hasNode('»123»a')).to.be.true
      expect(graph.hasNode('»123»b')).to.be.true
      expect(graph.node('»123»a').path).to.eql(['123', 'a'])
      expect(graph.node('»123»b').path).to.eql(['123', 'b'])
    })
  })

  describe('Edge functions', () => {
    it('Can add edges to the graph', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
      var newGraph = Graph.addEdge(graph, {from: 'a@out', to: 'b@in'})
      expect(Graph.edges(newGraph)).to.have.length(1)
      expect(Graph.edges(newGraph)[0].from).to.eql(['a'])
      expect(Graph.edges(newGraph)[0].outPort).to.equal('out')
      expect(Graph.edges(newGraph)[0].to).to.eql(['b'])
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
      var cmpd = Graph.compound({id: 'c', ports: [{name: 'out', kind: 'output', type: 'a'}]})
        .addNode({id: 'a', ports: [{name: 'out', kind: 'output', type: 'a'}]})
        .addNode({id: 'b', ports: [{name: 'in', kind: 'input', type: 'a'}]})
        .addEdge({from: 'a@out', to: 'b@in'})
      var graph = Graph.empty()
        .addNode(cmpd)
      expect(Graph.edge(cmpd, {from: 'a@out', to: 'b@in'})).to.be.ok
      expect(() => Graph.edge(graph, {from: 'a@out', to: 'b@in'})).to.throw(Error)
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
