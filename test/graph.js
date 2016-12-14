/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet'
import * as Graph from '../src/graph'
import * as Node from '../src/node'
import {port} from '../src/port'
import _ from 'lodash'
import semver from 'semver'

var expect = chai.expect

const toNames = (graph) => (id) => Node.name(Graph.node(id, graph))

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
      nodes: [{id: '#a', ports: [{port: 'b', kind: 'output', type: 'a'}]}, {id: '#b', ports: [{port: 'b', kind: 'input', type: 'c'}]}],
      edges: [{from: {node: '#a', port: 'b'}, to: {node: '#b', port: 'b'}, layer: 'dataflow'}],
      components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    var graph = Graph.fromJSON(graphJSON)
    expect(graph).to.be.ok
    expect(Graph.nodes(graph)).to.have.length(2)
    expect(Graph.edges(graph)).to.have.length(1)
    expect(Graph.components(graph)).to.have.length(1)
  })

  it('fails if the json graph is not valid', () => {
    var graph1 = { // port in 'a' has the attribute 'koind' instead of 'kind'
      Nodes: [{id: '#a', ports: [{port: 'b', koind: 'output', type: 'c'}]}, {id: '#b', ports: [{port: 'b', kind: 'input', type: 'c'}]}],
      Edges: [{from: {node: '#a', port: 'b'}, to: {node: '#b', port: 'b'}, layer: 'dataflow'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph1)).to.throw(Error)
    var graph2 = { // Edge targets a non existing port 'b@b'
      Nodes: [{id: 'a', ports: [{port: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{port: 'c', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph2)).to.throw(Error)
    var graph3 = { // Edge targets a non existing port 'b@b'
      Nodes: [{id: 'a', ports: [{port: 'b', kind: 'output', type: 'c'}]}, {id: 'b', ports: [{port: 'c', kind: 'input', type: 'c'}]}],
      Edges: [{from: 'a@b', to: 'b@b', layer: 'dataflow'}],
      Components: [{componentId: 'c', version: '0.1.0', ports: [{port: 'b', kind: 'output', type: 'c'}]}]
    }
    expect(() => Graph.fromJSON(graph3)).to.throw(Error)
  })

  it('can have edges between references', () => {
    var graph = Graph.flow(
        Graph.addNode({ref: 'a'}),
        Graph.addNode({ref: 'a'}),
        (graph, objs) =>
          Graph.addEdge({from: port(objs()[0], 'a'), to: port(objs()[1], 'other')}, graph)
    )()
    expect(graph).to.be.ok
    expect(Graph.edges(graph)).to.have.length(1)
  })

  it('cannot add two nodes with the same name', () => {
    var graph = Graph.flow(Graph.addNode({ref: 'a', name: 'a'}))()
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

    it('can flow adding nodes', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'p', kind: 'output', type: 'a'}]})
      )()
      expect(Graph.nodes(graph)).to.have.length(2)
    })

    it('gets an empty array for the child nodes of an atomic node', () => {
      var nodes = Graph.nodes(Node.create({ports: [{port: 'a', kind: 'output'}]}))
      expect(nodes).to.have.length(0)
    })

    it('sets the type of ports to `generic` if no type is given', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'input'}]}))()
      expect(Graph.node('a', graph).ports[0].type).to.equal('generic')
    })

    it('should throw an error if an node with the same name gets added twice', () => {
      var graph = Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}, Graph.empty())
      expect(() => Graph.addNode({name: 'a', prop: 'p'}, graph)).to.throw(Error)
    })

    it('can check whether a node exists in the graph', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'p', kind: 'output', type: 'a'}]})
      )()
      expect(Graph.hasNode('a', graph)).to.be.true
      expect(Graph.hasNode({name: 'b'}, graph)).to.be.true
    })

    it('can update a port of a node', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}, {port: 'p2', kind: 'output', type: 'a'}]}),
      )()
      var graph1 = Graph.setNodePort('a', 'p', {type: 'c'}, graph)
      var graph2 = Graph.setNodePort('a', 1, {type: 'd'}, graph)
      expect(Graph.node('a', graph1).ports[0].type).to.equal('c')
      expect(Graph.node('a', graph2).ports[1].type).to.equal('d')
    })
  })

  describe('Compound Node functions', () => {
    it('sets the path when creating compounds', () => {
      var impl = Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]})
      expect(impl.path).to.eql([])
    })

    it('gets nodes by compound path', () => {
      var impl = Graph.flow(
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
      expect(n.path.map(toNames(graph))).to.eql(['a', 'a'])
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
      var graph = Graph.flow(
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
      expect(nodes.map((n) => Node.path(n).map(toNames(graph)))).to.have.deep.members([['b', 'a'], ['b']])
    })

    it('can get a node by component id', () => {
      var graph = Graph.flow(
        Graph.addNode({componentId: 'a', name: 'A', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({componentId: 'b', name: 'B', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )()
      expect(Graph.node('/a', graph).name).to.equal('A')
      expect(Graph.node('/b', graph).name).to.equal('B')
    })

    it('can get a node by component ref', () => {
      var graph = Graph.flow(
        Graph.addNode({ref: 'a', name: 'A', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({ref: 'b', name: 'B', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )()
      expect(Graph.node('/a', graph).name).to.equal('A')
      expect(Graph.node('/b', graph).name).to.equal('B')
    })

    it('removes a node on the root level', () => {
      var graph = Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}, Graph.empty())
      var remGraph = Graph.removeNode('a', graph)
      expect(remGraph).to.be.ok
      expect(Graph.nodes(remGraph)).to.have.length(0)
    })

    it('does not remove other nodes when removing a specific node', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'p', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'p', kind: 'output', type: 'a'}]})
      )()
      var remGraph = Graph.removeNode('a', graph)
      expect(remGraph).to.be.ok
      expect(Graph.nodes(remGraph)).to.have.length(1)
      expect(Graph.hasNode('a', remGraph)).to.be.false
      expect(Graph.hasNode('b', remGraph)).to.be.true
    })

    it('removes nodes in compounds', () => {
      var impl = Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      var remGraph = Graph.removeNode(['b', 'a'], graph)
      expect(Graph.hasNode('»b»a', remGraph)).to.be.false
      expect(Graph.hasNode('b', remGraph)).to.be.true
    })

    it('removes nodes in compounds in compounds', () => {
      var impl = Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var impl2 = Graph.addNode(impl, Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output'}]}))
      var graph = Graph.addNode(impl2, Graph.empty())
      var remGraph = Graph.removeNode(['c', 'b', 'a'], graph)
      expect(Graph.hasNode('»c»b»a', remGraph)).to.be.false
      expect(Graph.hasNode('c', remGraph)).to.be.true
      expect(Graph.hasNode('»c»b', remGraph)).to.be.true
    })

    it('removes compounds that contain nodes', () => {
      var impl = Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true},
        Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var impl2 = Graph.addNode(impl, Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output'}]}))
      var graph = Graph.addNode(impl2, Graph.empty())
      var remGraph = Graph.removeNode(['c', 'b'], graph)
      expect(Graph.hasNode('»c»b»a', remGraph)).to.be.false
      expect(Graph.hasNode('c', remGraph)).to.be.true
      expect(Graph.hasNode('»c»b', remGraph)).to.be.false
    })

    it('only removes specified node in compound', () => {
      var impl = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )(Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      var remGraph = Graph.removeNode(['b', 'b'], graph)
      expect(Graph.hasNode('»b»a', remGraph)).to.be.true
      expect(Graph.hasNode('»b»b', remGraph)).to.be.false
      expect(Graph.hasNode('b', remGraph)).to.be.true
    })

    it('can address nodes relative to compound', () => {
      var impl = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )(Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.addNode(impl, Graph.empty())
      expect(Graph.hasNode('a', Graph.node('c', graph))).to.be.true
      expect(Graph.hasNode('b', Graph.node('c', graph))).to.be.true
    })

    it('replaces references with a node', () => {
      var graph = Graph.flow(
        Graph.addNode({ref: 'abc', name: '123'}),
        Graph.replaceNode('123', {componentId: 'abc', ports: [{port: 'a', kind: 'output', type: 'string'}], atomic: true})
      )()
      expect(Graph.hasNode('123', graph)).to.be.true
      expect(Graph.nodes(graph)).to.have.length(1)
      expect(Graph.node('123', graph).atomic).to.be.true
      expect(Graph.node('123', graph).componentId).to.equal('abc')
      expect(Graph.node('123', graph).ref).to.be.undefined
      expect(Graph.node(Graph.node('123', graph).id, graph)).to.be.ok
    })

    it('replaces references with a compound node', () => {
      var impl = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )(Graph.compound({componentId: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var graph = Graph.replaceNode(
        '123', impl,
        Graph.addNode({ref: 'abc', name: '123'}, Graph.empty()))
      expect(Graph.hasNode('123', graph)).to.be.true
      expect(Graph.nodes(graph)).to.have.length(1)
      expect(Graph.nodesDeep(graph)).to.have.length(3)
      expect(Graph.hasNode('»123»a', graph)).to.be.true
      expect(Graph.hasNode('»123»b', graph)).to.be.true
      expect(Graph.node('»123»a', graph).id).to.eql(Graph.node(Graph.node('»123»a', graph).id, graph).id)
      expect(Graph.node('»123»b', graph).id).to.eql(Graph.node(Graph.node('»123»b', graph).id, graph).id)
    })

    it('replaces ports in short notation in edges when replacing', () => {
      var impl = Graph.flow(
        Graph.addEdge({from: '@in', to: '@out'})
      )(Graph.compound({componentId: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}, {port: 'in', kind: 'input', type: 'string'}]}))
      var replGraph = Graph.addNode({ref: 'abc', name: '123'}, Graph.empty())
      var graph = Graph.replaceNode(
        '123', impl, replGraph)
      var edges = Graph.incidents('123', graph)
      expect(edges).to.have.length(1)
      expect(Graph.isFrom('123', graph, edges[0])).to.be.true
      expect(Graph.pointsTo('123', graph, edges[0])).to.be.true
    })

    it('copes with multiple levels of compound nodes', () => {
      var impl = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'number'}], atomic: true})
      )(Graph.compound({name: 'comp', componentId: 'b', ports: [{port: 'out', kind: 'output', type: 'string'}]}))
      var impl2 = Graph.flow(
        Graph.addNode(impl)
      )(Graph.compound({componentId: 'c', ports: [{port: 'out', kind: 'output'}]}))
      var graph = Graph.replaceNode(
        '123', impl2,
        Graph.addNode({ref: 'abc', name: '123'}, Graph.empty()))
      expect(Graph.hasNode('123', graph)).to.be.true
      expect(Graph.nodes(graph)).to.have.length(1)
      expect(Graph.nodesDeep(graph)).to.have.length(4)
      expect(Graph.hasNode('»123»comp»a', graph)).to.be.true
      expect(Graph.hasNode('»123»comp»b', graph)).to.be.true
      expect(Graph.node('»123»comp»a', graph).id).to.eql(Graph.node(Graph.node('»123»comp»a', graph).id, graph).id)
      expect(Graph.node('»123»comp»b', graph).id).to.eql(Graph.node(Graph.node('»123»comp»b', graph).id, graph).id)
    })

    it('Removing a node removes its edges', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input'}]}),
        (graph, objs) => Graph.addEdge({from: port(objs()[0], 'out'), to: port(objs()[1], 'in')})(graph)
      )()
      expect(Graph.edges(Graph.removeNode('a', graph)).length).to.equal(0)
      expect(Graph.edges(Graph.removeNode('b', graph)).length).to.equal(0)
    })

    it('Adding a compound relabels all edges to the new id', () => {
      var comp = Graph.addEdge({from: '@inC', to: '@outC'},
        Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      expect(Graph.predecessors('', comp)).to.have.length(1)
      expect(Graph.successors('', comp)).to.have.length(1)
      var graph = Graph.addNode(comp, Graph.empty())
      expect(Graph.predecessors('c', graph)).to.have.length(1)
      expect(Graph.successors('c', graph)).to.have.length(1)
    })

    it('is possible to set node values deep in the graph', () => {
      var cmpd1 = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input'}]})
      )(Graph.compound({name: 'b', ports: [{port: 'out', kind: 'output'}]}))
      var cmpd2 = Graph.flow(
        Graph.addNode(cmpd1)
      )(Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode(cmpd2)
      )()
      var settedGraph = Graph.set({isSet: true}, '»c»b»a', graph)
      expect(Graph.get('isSet', '»c»b»a', settedGraph)).to.be.true
      var settedGraph2 = Graph.set({isSet: true}, '»c»b', graph)
      expect(Graph.get('isSet', '»c»b', settedGraph2)).to.be.true
      var settedGraph3 = Graph.set({isSet: true}, 'c', graph)
      expect(Graph.get('isSet', 'c', settedGraph3)).to.be.true
    })
  })

  describe('Edge functions', () => {
    it('Can add edges to the graph', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      )()
      var newGraph = Graph.addEdge({from: 'a@out', to: 'b@in'}, graph)
      expect(Graph.edges(newGraph)).to.have.length(1)
      expect(Graph.edges(newGraph)[0].from.port).to.eql('out')
      expect(Graph.edges(newGraph)[0].to.port).to.eql('in')
    })

    it('Can remove edges from the graph', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addEdge({from: 'a@out', to: 'b@in'})
      )()
      var newGraph = Graph.removeEdge({from: 'a@out', to: 'b@in'}, graph)
      expect(Graph.edges(newGraph)).to.have.length(0)
    })

    it('Throws an error if the edge that should be deleted does not exist', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      )()
      expect(() => Graph.removeEdge({from: 'a@out', to: 'b@in'}, graph)).to.throw(Error)
    })

    it('Throws an error if at least one node in the edge does not exist', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]})
      )()
      expect(() => Graph.addEdge({from: 'N@out', to: 'b@in'}, graph))
        .to.throw(Error)
      expect(() => Graph.addEdge({from: 'a@out', to: 'N@in'}, graph))
        .to.throw(Error)
      expect(() => Graph.addEdge({from: 'N@out', to: 'M@in'}, graph))
        .to.throw(Error)
    })

    it('Throws an error if the edge is a loop', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]})
      )()
      expect(() => Graph.addEdge({from: 'b@in', to: 'b@in'}, graph))
        .to.throw(Error)
    })

    it('Throws an error if the edge goes from output to output', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]})
      )()
      expect(() => Graph.addEdge({from: 'a@out', to: 'b@out'}, graph))
        .to.throw(Error)
    })

    it('Check whether an edge is in the graph', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]})
      )()
      var newGraph = Graph.addEdge({from: 'a@out', to: 'b@in'}, graph)
      expect(Graph.hasEdge({from: 'a@out', to: 'b@in'}, graph)).to.be.false
      expect(Graph.hasEdge({from: 'a@out', to: 'b@in'}, newGraph)).to.be.true
    })

    it('Check whether an edge is in the graph with /ref or /componentId syntax in nodes', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ref: 'BB', ports: [{port: 'inB', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'a', ref: 'AA', ports: [{port: 'outA', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'bb', componentId: 'BBB', ports: [{port: 'inBB', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'aa', componentId: 'AAA', ports: [{port: 'outAA', kind: 'output', type: 'a'}]})
      )()
      var newGraph = Graph.addEdge({from: 'a@outA', to: 'b@inB'}, 
                     Graph.addEdge({from: 'aa@outAA', to: 'bb@inBB'}, graph))
      // ref
      expect(Graph.hasEdge({from: '/AA@outA', to: '/BB@inB'}, graph)).to.be.false
      expect(Graph.hasEdge({from: '/AA@outA', to: '/BB@inB'}, newGraph)).to.be.true
      expect(Graph.hasEdge({from: '/AA@outA', to: '/BB@inC'}, newGraph)).to.be.false
      expect(Graph.hasEdge({from: '/AA@outE', to: '/BB@inB'}, newGraph)).to.be.false
      // componentId
      expect(Graph.hasEdge({from: '/AAA@outAA', to: '/BBB@inBB'}, graph)).to.be.false
      expect(Graph.hasEdge({from: '/AAA@outAA', to: '/BBB@inBB'}, newGraph)).to.be.true
      expect(Graph.hasEdge({from: '/AAA@0', to: '/BBB@0'}, newGraph)).to.be.true
      expect(Graph.hasEdge({from: '/AAA@outAA', to: '/BBB@inC'}, newGraph)).to.be.false
      expect(Graph.hasEdge({from: '/AAA@5', to: '/BBB@0'}, newGraph)).to.be.false
      expect(Graph.hasEdge({from: '/AAA@0', to: '/BBB@5'}, newGraph)).to.be.false
      expect(Graph.hasEdge({from: '/AAA@outCCC', to: '/BBB@inBB'}, newGraph)).to.be.false
    })

    it('Check whether an edge is in the graph with /componentId syntax for multiple components', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ref: 'BB', ports: [{port: 'inB', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'a', ref: 'AA', ports: [{port: 'outA', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'a2', ref: 'AA', ports: [{port: 'outA', kind: 'output', type: 'a'}]})
      )()
      var newGraph = Graph.addEdge({from: 'a2@outA', to: 'b@inB'}, graph)
      // ref
      expect(Graph.hasEdge({from: '/AA@outA', to: '/BB@inB'}, newGraph)).to.be.true
      expect(Graph.hasEdge({from: '/AA@outA', to: '/BB@inC'}, newGraph)).to.be.false
      expect(Graph.hasEdge({from: '/AA@outD', to: '/BB@inB'}, newGraph)).to.be.false
    })

    it('Check whether an edge is in the graph with /componentId syntax for multiple components with port numbers', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ref: 'BB', ports: [{port: 'inB', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'a', ref: 'AA', ports: [{port: 'outA', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'a2', ref: 'AA', ports: [{port: 'outA', kind: 'output', type: 'a'}]})
      )()
      var newGraph = Graph.addEdge({from: 'a2@outA', to: 'b@inB'}, graph)
      // ref
      expect(Graph.hasEdge({from: '/AA@0', to: '/BB@0'}, newGraph)).to.be.true
      expect(Graph.hasEdge({from: '/AA@1', to: '/BB@0'}, newGraph)).to.be.false
      expect(Graph.hasEdge({from: '/AA@0', to: '/BB@1'}, newGraph)).to.be.false
    })

    it('Check whether an parent port notation is possible with the number style', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ref: 'BB', ports: [{port: 'inB', kind: 'input', type: 'a'}]})
      )()
      graph.ports = [{port: 'a', kind: 'input', type: 'generic'}]
      var newGraph = Graph.addEdge({from: '@0', to: 'b@inB'}, graph)
      // ref
      expect(Graph.hasEdge({from: '@0', to: '/BB@0'}, newGraph)).to.be.true
    })

    it.skip('It should not find the parent in compound queries', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ref: 'BB', ports: [{port: 'inB', kind: 'input', type: 'a'}]})
      )()
      graph.ports = [{port: 'a', kind: 'input', type: 'generic'}]
      graph.componentId = 'OUTER'
      var newGraph = Graph.addEdge({from: '@0', to: 'b@inB'}, graph)
      // ref
      expect(Graph.hasEdge({from: '/OUTER@0', to: '/BB@0'}, newGraph)).to.be.false
      expect(Graph.hasEdge({from: '/OUTER', to: '/BB@0'}, newGraph)).to.be.false
    })

    it('Check whether an edge is in the graph with /ref or /componentId syntax in edges', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'b', ref: 'BB', ports: [{port: 'inB', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'a', ref: 'AA', ports: [{port: 'outA', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'bb', componentId: 'BBB', ports: [{port: 'inBB', kind: 'input', type: 'a'}]}),
        Graph.addNode({name: 'aa', componentId: 'AAA', ports: [{port: 'outAA', kind: 'output', type: 'a'}]})
      )()
      var newGraph = Graph.addEdge({from: 'a@outA', to: 'b@inB'}, 
                     Graph.addEdge({from: 'aa@outAA', to: 'bb@inBB'}, graph))
      // ref
      expect(Graph.hasEdge({from: '/AA', to: '/BB'}, graph)).to.be.false
      expect(Graph.hasEdge({from: '/AA', to: '/BB'}, newGraph)).to.be.true
      // componentId
      expect(Graph.hasEdge({from: '/AAA', to: '/BBB'}, graph)).to.be.false
      expect(Graph.hasEdge({from: '/AAA', to: '/BBB'}, newGraph)).to.be.true
    })

    it('Get an edge in the graph', () => {
      var cmpd = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addEdge({from: 'a@out', to: 'b@in'})
      )(Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output', type: 'a'}]}))
      var graph = Graph.addNode(cmpd, Graph.empty())
      expect(Graph.edge({from: '»c»a@out', to: '»c»b@in', graph})).to.be.ok
      expect(() => Graph.edge({from: 'a@out', to: 'b@in'}, graph)).to.throw(Error)
    })

    it('Can add edges in compounds', () => {
      var cmpd = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      )(Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output', type: 'a'}]}))
      var graph = Graph.flow(
        Graph.addNode(cmpd),
        Graph.addEdge({from: '»c»a@out', to: '»c»b@in'})
      )()
      // accessible via the root graph
      expect(Graph.edge({from: '»c»a@out', to: '»c»b@in', graph})).to.be.ok
      // accessible via the compound node
      expect(Graph.edge({from: 'a@out', to: 'b@in', graph}, Graph.node('c', graph))).to.be.ok
    })

    it('Can connect from the compound to an inner node', () => {
      var cmpd = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      )(Graph.compound({name: 'c', ports: [{port: 'in', kind: 'input', type: 'a'}]}))
      var graph = Graph.flow(
        Graph.addNode(cmpd),
        Graph.addEdge({from: '»c@in', to: '»c»a@in'})
      )()
      expect(Graph.successors('c', graph)).to.have.length(1)
      expect(Graph.node(Graph.successors('c', graph)[0], graph).name).to.equal('a')
    })

    it('Can connect from the root compound to an inner node', () => {
      const cmpd = Graph.compound({ports: [{port: 'in', kind: 'input', type: 'a'}]})
      const graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addEdge({from: '@in', to: 'a@in'})
      )(cmpd)
      expect(Graph.successors(cmpd.id, graph)).to.have.length(1)
      expect(Graph.node(Graph.successors(cmpd.id, graph)[0], graph).name).to.equal('a')
    })

    it('Fails if the connecting ports do not exist', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]})
      )()
      expect(() => Graph.addEdge({from: 'a@no', to: 'b@in', parent: 'a'}, graph)).to.throw(Error)
      expect(() => Graph.addEdge({from: 'a@out', to: 'b@no', parent: 'a'}, graph)).to.throw(Error)
      expect(() => Graph.addEdge({from: 'a@no', to: 'b@no', parent: 'a'}, graph)).to.throw(Error)
      expect(() => Graph.addEdge({from: 'a@in', to: 'b@out', parent: 'a'}, graph)).to.throw(Error)
    })

    it('Gets the predecessors for a node', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addEdge({from: 'a@out', to: 'b@in'})
      )()
      expect(_.map(Graph.predecessors('b', graph), 'port')).to.eql(['out'])
      expect(_.map(Graph.predecessors({node: 'b', port: 'in'}, graph), 'port')).to.eql(['out'])
    })

    it('Returns the predecessors inside a compound node', () => {
      var cmpd = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'a'}]})
      )(Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output', type: 'a'}]}))
      var graph = Graph.flow(
        Graph.addNode(cmpd),
        Graph.addEdge({from: '»c»a@out', to: '»c@out'})
      )()
      expect(Graph.predecessors('c', graph)).to.have.length(1)
      expect(Graph.node(Graph.predecessor('c', graph), graph).name).to.equal('a')
    })

    it('adds edges via a flow', () => {
      var graph = Graph.flow(
        Graph.addNode({ports: [{port: 'out', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input'}]}),
        (graph, objs) => Graph.addEdge({from: port(objs()[0], 'out'), to: port(objs()[1], 'in')})(graph)
      )()
      expect(Graph.predecessors('b', graph)).to.have.length(1)
      expect(Graph.predecessor('b', graph).port).to.equal('out')
      expect(Graph.predecessors('b', graph)[0].port).to.equal('out')
      expect(Graph.predecessors({node: 'b', port: 'in'}, graph)[0].port).to.equal('out')
    })

    it('Can remove an edge', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input'}]}),
        (graph, objs) => Graph.addEdge({from: port(objs()[0], 'out'), to: port(objs()[1], 'in')})(graph)
      )()
      var edge = Graph.inIncident('b', graph)
      expect(Graph.edges(Graph.removeEdge(edge, graph)).length).to.equal(0)
      expect(Graph.edges(Graph.removeEdge({from: 'a@out', to: 'b@in'}, graph)).length).to.equal(0)
    })

    it.skip('Supports special syntax', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input'}, {port: 'out', kind: 'output'}]}),
        Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input'}]}),
        (graph, objs) => Graph.addEdge({from: port(objs()[0], 'out'), to: port(objs()[1], 'in')})(graph),
        Graph.addEdge({from: 'b@out', to: 'c@in'})
      )()
      // all edges from a to b
      expect(Graph.edges(Graph.removeEdge({from: 'a', to: 'b'}, graph)).length).to.equal(1)
      // all edges from a
      expect(Graph.edges(Graph.removeEdge({from: 'a'}, graph)).length).to.equal(1)
      expect(Graph.edges(Graph.removeEdge('a→', graph)).length).to.equal(1)
      // all edges to b
      expect(Graph.edges(Graph.removeEdge({to: 'b'}, graph)).length).to.equal(1)
      expect(Graph.edges(Graph.removeEdge('→b', graph)).length).to.equal(1)
      // all edges from and to b
      expect(Graph.edges(Graph.removeEdge('b', graph)).length).to.equal(0)
      expect(Graph.edges(Graph.removeEdge('→b→', graph)).length).to.equal(0)
    })

    it('Gets the successors for a node', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input'}]}),
        Graph.addNode({name: 'c', ports: [{port: 'in2', kind: 'input'}]}),
        Graph.addEdge({from: 'a@out', to: 'b@in'}),
        Graph.addEdge({from: 'a@out', to: 'c@in2'})
      )()
      expect(Graph.successors('a', graph)).to.have.length(2)
      expect(_.map(Graph.successors('a', graph), 'port')).to.deep.have.members(['in', 'in2'])
    })

    it('is possible to add a non dataflow edge', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in', kind: 'input'}]}),
        Graph.addEdge({from: 'a', to: 'b', layer: 'recursion'})
      )()
      expect(Graph.edges(graph)).to.have.length(1)
      expect(Graph.hasEdge({from: 'a', to: 'b', layer: 'recursion'}, graph)).to.be.true
    })

    it('is possible to add a non dataflow edge in compounds', () => {
      var cmpd = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input'}]})
      )(Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode(cmpd),
        Graph.addEdge({from: '»c»a', to: 'c', layer: 'recursion'})
      )()
      expect(Graph.edges(graph)).to.have.length(1)
      expect(Graph.hasEdge({from: '»c»a', to: 'c', layer: 'recursion'}, graph)).to.be.true
    })

    it('is possible to add a non dataflow edge inside compounds', () => {
      var cmpd = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'in', kind: 'input'}]}),
        Graph.addEdge({from: 'a', to: '', layer: 'recursion'})
      )(Graph.compound({name: 'c', ports: [{port: 'out', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode(cmpd)
      )()
      expect(Graph.edges(graph)).to.have.length(1)
      expect(Graph.hasEdge({from: '»c»a', to: 'c', layer: 'recursion'}, graph)).to.be.true
    })
  })

  describe('Meta information', () => {
    it('returns a map of all meta information', () => {
      var graph = Graph.setMetaKey('a', 'b', Graph.empty())
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal('b')
    })

    it('sets a whole object as meta', () => {
      var graph = Graph.setMeta({a: 'b'}, Graph.empty())
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal('b')
    })

    it('import from JSON', () => {
      var graphJSON = {
        nodes:[],
        edges:[],
        metaInformation: {a: 'test'}
      }
      var graph = Graph.fromJSON(graphJSON)
      expect(graph).to.be.ok
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal(graphJSON.metaInformation.a)
    })
  })

  describe('References', () => {
    var graphJSON = () => ({
      nodes:
      [
        {
          ref: 'math/add',
          id: '#ciujt9ktl0003lumriay99r9m'
        },
        {
          ref: 'std/const',
          id: '#ciujt9ktp0004lumrth5o5vnd'
        }],
      ports:
        [{ port: 'x', kind: 'input', type: 'generic' },
          { port: 'value', kind: 'output', type: 'generic' }],
      atomic: false,
      id: '#ciujt9kti0002lumr7poczkzx',
      version: '0.0.0',
      componentId: 'myInc',
      name: 'c'
    })

    it('import', () => {
      var graph = Graph.fromJSON(graphJSON())
      expect(graph).to.be.ok
      expect(Graph.nodes(graph)).to.have.length(2)
      expect(Graph.edges(graph)).to.have.length(0)
      expect(Graph.components(graph)).to.have.length(0)
      expect(graph.ports).to.be.deep.equal(graphJSON().ports)
    })

    it('Simple add edge test', () => {
      var comp = Graph.addEdge({from: '@x', to: '@value'}, Graph.compound(graphJSON()))
      expect(comp).to.be.ok

      expect(Graph.predecessors('', comp)).to.have.length(1)
      expect(Graph.successors('', comp)).to.have.length(1)
      var graph = Graph.addNode(comp, Graph.empty())
      expect(Graph.predecessors('c', graph)).to.have.length(1)
      expect(Graph.successors('c', graph)).to.have.length(1)
    })

    it('Use addEdge @name notation', () => {
      var graph = Graph.fromJSON(graphJSON())
      var cmpt = Graph.compound(graphJSON())
      var out = Graph.addEdge({from: '@x', to: '@value'}, cmpt)
      var out2 = Graph.addEdge({from: '@x', to: '@value'}, graph)
      expect(out).to.be.ok
      expect(Graph.edges(out)).to.have.length(1)
      expect(out2).to.be.ok
      expect(Graph.edges(out2)).to.have.length(1)
    })

    it('Use addEdge @Number notation', () => {
      var graph = Graph.fromJSON(graphJSON())
      var out = Graph.addEdge({from: '@0', to: '#ciujt9ktl0003lumriay99r9m@0'}, graph)
      expect(out).to.be.ok
      expect(Graph.edges(out)).to.have.length(1)
    })

    it('Use addEdge @Number for inner edges', () => {
      var graph = Graph.fromJSON(graphJSON())
      var out = Graph.addEdge({from: '@0', to: '@0'}, graph)
      expect(out).to.be.ok
      expect(Graph.edges(out)).to.have.length(1)
    })

    it('Use addEdge #id@name notation', () => {
      var out = Graph.addEdge({from: '#ciujt9kti0002lumr7poczkzx@x', to: '#ciujt9kti0002lumr7poczkzx@value'}, Graph.compound(graphJSON()))
      expect(out).to.be.ok
      expect(Graph.edges(out)).to.have.length(1)
    })

    it('Use addEdge #id@Number notation', () => {
      var graph = Graph.fromJSON(graphJSON())
      var out = Graph.addEdge({from: '#ciujt9kti0002lumr7poczkzx@0', to: '#ciujt9kti0002lumr7poczkzx@0'}, graph)
      var out2 = Graph.addEdge({from: '#ciujt9kti0002lumr7poczkzx@0', to: '#ciujt9ktl0003lumriay99r9m@0'}, graph)
      expect(out).to.be.ok
      expect(Graph.edges(out)).to.have.length(1)
      expect(out2).to.be.ok
      expect(Graph.edges(out2)).to.have.length(1)
    })
  })
})
