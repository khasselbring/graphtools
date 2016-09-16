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

  it.skip('clones a graph', () => {
    var graph = Graph.empty()
    graph.arr = []
    var newGraph = Graph.clone(graph)
    newGraph.arr.push(1)
    expect(graph.arr).to.have.length(0)
    expect(newGraph.arr).to.have.length(1)
    expect.fail('stange test...')
  })

  it('imports a graph from json', () => {
    var graphJSON = {
      Nodes: [{name: 'a', ports: [{port: 'b', kind: 'output'}]}, {name: 'b', ports: [{port: 'b', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    var graph = Graph.fromJSON(graphJSON)
    expect(graph).to.be.ok
    expect(Graph.nodes(graph)).to.have.length(2)
    expect(Graph.edges(graph)).to.have.length(1)
    expect(Graph.components(graph)).to.have.length(1)
  })

  it('importing JSON files is case insensitive', () => {
    var graphJSON = {
      nodes: [{name: 'a', ports: [{port: 'b', kind: 'output', type: 'c'}]}, {name: 'b', ports: [{port: 'b', kind: 'input', type: 'c'}]}],
      edges: [{from: 'a@b', to: 'b@b'}],
      components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    var graph = Graph.fromJSON(graphJSON)
    expect(graph).to.be.ok
    expect(Graph.nodes(graph)).to.have.length(2)
    expect(Graph.edges(graph)).to.have.length(1)
    expect(Graph.components(graph)).to.have.length(1)
  })

  it('fails if the json graph is not valid', () => {
    var graph1 = {
      Nodes: [{id: 'a', ports: [{port: 'b', koind: 'output', type: 'c'}]}, {id: 'b', ports: [{port: 'b', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph1)).to.throw(Error)
    var graph2 = {
      Nodes: [{id: 'a', ports: [{port: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{port: 'c', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph2)).to.throw(Error)
  })

  it('can have edges between references', () => {
    var graph = Graph.chain(
        Graph.addNode({ref: 'a'}),
        Graph.addNode({ref: 'a'}),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0] + '@a', to: objs()[1] + '@other'}, graph)
    )()
    expect(graph).to.be.ok
    expect(Graph.edges(graph)).to.have.length(1)
  })

  it('cannot add two nodes with the same name', () => {
    var graph = Graph.chain(Graph.addNode({ref: 'a', name: 'a'}))()
    expect(() => Graph.addNode({ref: 'a', name: 'a'}, graph)).to.throw(Error)
  })

  describe('Basic Node functions', () => {
    it('fails if a non existend node is queried', () => {
      expect(() => Graph.node('a', Graph.empty())).to.throw(Error)
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
      expect(Graph.nodesBy((n) => n.id.indexOf('a') === 0, graph)).to.have.length(2)
    })

    it('adds nodes to the graph', () => {
      var graph = Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}, Graph.empty())
      expect(Graph.hasNode('a', graph)).to.be.true
    })

    it('can chain adding nodes', () => {
      var graph = Graph.chain(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'p', kind: 'output', type: 'a'}]})
      )()
      expect(Graph.nodes(graph)).to.have.length(2)
    })

    it('sets the type of ports to `generic` if no type is given', () => {
      var graph = Graph.chain(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'input'}]}))()
      expect(Graph.node('a', graph).ports[0].type).to.equal('generic')
    })

    it('should throw an error if the node data is not valid', () => {
      expect(() => Graph.addNode({}, Graph.empty())).to.throw(Error)
    })

    it('should throw an error if an node with the same name gets added twice', () => {
      var graph = Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}, Graph.empty())
      expect(() => Graph.addNode({name: 'a', prop: 'p'}, graph)).to.throw(Error)
    })

    it('can check whether a node exists in the graph', () => {
      var graph = changeSet.applyChangeSets(Graph.empty(), [
        changeSet.insertNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}),
        changeSet.insertNode({name: 'b', ports: [{port: 'p', kind: 'output', type: 'a'}]})
      ])
      expect(Graph.hasNode('a', graph)).to.be.true
      expect(Graph.hasNode({name: 'b'}, graph)).to.be.true
    })
  })

  describe('Compound Node functions', () => {
    it('sets the path when creating compounds', () => {
      var impl = Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]})
      expect(impl.path).to.eql([])
    })

    it('gets nodes by compound path', () => {
      var impl = Graph.chain(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )(Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      var n = Graph.node(['b', 'a'], graph)
      expect(n).to.be.ok
      expect(n.name).to.equal('a')
      n = Graph.node('»b»a', graph)
      expect(n).to.be.ok
      expect(n.name).to.equal('a')
    })

    it('does not confuse parent compounds and inner nodes', () => {
      var impl = Graph.addNode(
        {name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'a', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      var n = Graph.node(['a', 'a'], graph)
      expect(n).to.be.ok
      expect(n.name).to.equal('a')
      expect(n.path).to.eql(['a', 'a'])
      expect(n.atomic).to.be.true
    })

    it('checks nodes by compound path', () => {
      var impl = Graph.addNode(
        {name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      expect(Graph.hasNode(['b', 'a'], graph)).to.be.true
      expect(Graph.hasNode('»b»a', graph)).to.be.true
      expect(Graph.hasNode(['a'], graph)).to.be.false
      expect(Graph.hasNode(['a', 'b'], graph)).to.be.false
    })

    it('adds nodes in compounds', () => {
      var impl = Graph.addNode(
        {name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.chain(
        Graph.addNode(impl),
        Graph.addNodeByPath('b', {name: 'c', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )()
      expect(Graph.hasNode(['b', 'a'], graph)).to.be.true
      expect(Graph.hasNode(['b', 'c'], graph)).to.be.true
    })

    it('gets nodes deep including compound nodes', () => {
      var impl = Graph.addNode(
        {name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      var nodes = Graph.nodesDeep(graph)
      expect(nodes).to.have.length(2)
      expect(nodes.map((n) => Node.path(n))).to.have.deep.members([['b', 'a'], ['b']])
    })

    it('removes a node on the root level', () => {
      var graph = Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}, Graph.empty())
      var remGraph = Graph.removeNode('a', graph)
      expect(remGraph).to.be.ok
      expect(Graph.nodes(remGraph)).to.have.length(0)
    })

    it('does not remove other nodes when removing a specific node', () => {
      var graph = Graph.chain(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'p', kind: 'output', type: 'a'}]})
      )()
      var remGraph = Graph.removeNode('a', graph)
      expect(remGraph).to.be.ok
      expect(Graph.nodes(remGraph)).to.have.length(1)
      expect(Graph.hasNode('a', remGraph)).to.be.false
      expect(Graph.hasNode('b', remGraph)).to.be.true
    })

    it.only('removes nodes in compounds', () => {
      var impl = Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      var remGraph = Graph.removeNode(['b', 'a'], graph)
      expect(Graph.hasNode('»b»a', remGraph)).to.be.false
      expect(Graph.hasNode('b', remGraph)).to.be.true
    })

    it('only removes specified node in compound', () => {
      var impl = Graph.chain(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )(Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      var remGraph = Graph.removeNode(['b', 'b'], graph)
      expect(Graph.hasNode('»b»a', remGraph)).to.be.true
      expect(Graph.hasNode('»b»b', remGraph)).to.be.false
      expect(Graph.hasNode('b', remGraph)).to.be.true
    })

    it.skip('replaces references with a node', () => {
      var graph = Graph.chain(
        Graph.addNode({ref: 'abc', name: '123'}),
        Graph.replaceNode('123', {componentId: 'abc', ports: [{port: 'a', kind: 'output', type: 'string'}], atomic: true})
      )()
      expect(Graph.hasNode('123', graph)).to.be.true
      expect(Graph.nodes(graph)).to.have.length(1)
      expect(Graph.node('123', graph).atomic).to.be.true
      expect(Graph.node('123', graph).componentId).to.equal('abc')
      expect(Graph.node('123', graph).ref).to.be.undefined
    })

    it.skip('replaces references with a compound node', () => {
      var impl = Graph.chain(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )(Graph.compound({componentId: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.replaceNode(
        '123', impl,
        Graph.addNode({ref: 'abc', name: '123'}, Graph.empty()))
      expect(graph.hasNode('123')).to.be.true
      expect(graph.nodes()).to.have.length(1)
      expect(graph.nodesDeep()).to.have.length(3)
      expect(graph.hasNode('»123»a')).to.be.true
      expect(graph.hasNode('»123»b')).to.be.true
      expect(graph.node('»123»a').path).to.eql(['123', 'a'])
      expect(graph.node('»123»b').path).to.eql(['123', 'b'])
    })
  })

  describe.skip('Edge functions', () => {
    it('Can add edges to the graph', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      var newGraph = Graph.addEdge(graph, {from: 'a@out', to: 'b@in'})
      expect(Graph.edges(newGraph)).to.have.length(1)
      expect(Graph.edges(newGraph)[0].from).to.eql(['a'])
      expect(Graph.edges(newGraph)[0].outPort).to.equal('out')
      expect(Graph.edges(newGraph)[0].to).to.eql(['b'])
      expect(Graph.edges(newGraph)[0].inPort).to.equal('in')
    })

    it('Throws an error if at least one node in the edge does not exist', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'N@out', to: 'b@in'}))
        .to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@out', to: 'N@in'}))
        .to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'N@out', to: 'M@in'}))
        .to.throw(Error)
    })

    it('Throws an error if the edge is a loop', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'b@in', to: 'b@in'}))
        .to.throw(Error)
    })

    it('Throws an error if the edge goes from output to output', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{port: 'out', kind: 'output', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'a@out', to: 'b@out'}))
        .to.throw(Error)
    })

    it('Check whether an edge is in the graph', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      var newGraph = Graph.addEdge(graph, {from: 'a@out', to: 'b@in'})
      expect(Graph.hasEdge(graph, {from: 'a@out', to: 'b@in'})).to.be.false
      expect(Graph.hasEdge(newGraph, {from: 'a@out', to: 'b@in'})).to.be.true
    })

    it('Get an edge in the graph', () => {
      var cmpd = Graph.compound({id: 'c', ports: [{port: 'out', kind: 'output', type: 'a'}]})
        .addNode({id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]})
        .addNode({id: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
        .addEdge({from: 'a@out', to: 'b@in'})
      var graph = Graph.empty()
        .addNode(cmpd)
      expect(Graph.edge(cmpd, {from: 'a@out', to: 'b@in'})).to.be.ok
      expect(() => Graph.edge(graph, {from: 'a@out', to: 'b@in'})).to.throw(Error)
    })

    it('Fails if the connecting ports do not exist', () => {
      var graph = Graph.addNode(
        Graph.addNode(Graph.empty(), {id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}), {id: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      expect(() => Graph.addEdge(graph, {from: 'a@no', to: 'b@in', parent: 'a'})).to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@out', to: 'b@no', parent: 'a'})).to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@no', to: 'b@no', parent: 'a'})).to.throw(Error)
      expect(() => Graph.addEdge(graph, {from: 'a@in', to: 'b@out', parent: 'a'})).to.throw(Error)
    })

    it('Gets the predecessors for a node', () => {
      var graph = Graph.empty()
        .addNode({id: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]})
        .addNode({id: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
        .addEdge({from: 'a@out', to: 'b@in'})
      expect(graph.predecessors('b')).to.eql([{node: 'a', port: 'out'}])
      expect(graph.predecessors({node: 'b', port: 'in'})).to.eql([{node: 'a', port: 'out'}])
    })

    it('Gets the successors for a node', () => {
      var graph = Graph.empty()
        .addNode({id: 'a', ports: [{port: 'out', kind: 'output'}]})
        .addNode({id: 'b', ports: [{port: 'in', kind: 'input'}]})
        .addNode({id: 'c', ports: [{port: 'in2', kind: 'input'}]})
        .addEdge({from: 'a@out', to: 'b@in'})
        .addEdge({from: 'a@out', to: 'c@in2'})
      expect(graph.successors('a')).to.deep.have.members([{node: 'b', port: 'in'}, {node: 'c', port: 'in2'}])
      expect(graph.successors({node: 'a', port: 'out'})).to.deep.have.members([{node: 'b', port: 'in'}, {node: 'c', port: 'in2'}])
    })
  })

  describe('Meta information', () => {
    it('returns a map of all meta information', () => {
      var graph = Graph.setMeta('a', 'b', Graph.empty())
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal('b')
    })
  })
})
