/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph'
import {includePredecessor, excludeNode, unCompound, compoundify} from '../src/rewrite/compound'
import * as Node from '../src/node'
import {debug} from '../src/debug'
import _ from 'lodash'

var expect = chai.expect

describe('Rewrite basic API', () => {
  describe('Including predecessors', () => {
    it('can include the direct predecessor of a compound port into the compound', () => {
      var comp = Graph.addEdge({from: '@inC', to: '@outC'},
        Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.flow(
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

    it('can include the direct predecessor via short notation', () => {
      var comp = Graph.addEdge({from: '@inC', to: '@outC'},
        Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.flow(
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
      var rewGraph = includePredecessor('c@inC', graph)
      expect(Graph.nodes(rewGraph)).to.have.length(2)
      expect(Graph.nodes(Graph.node('c', rewGraph))).to.have.length(1)
      expect(Graph.inIncidents('c', rewGraph)).to.have.length(2)
      expect(Graph.node(Graph.predecessor('c@outC', rewGraph), rewGraph).componentId).to.equal('moved')
    })

    it('can include a node that is a predecessor of multiple ports', () => {
      var comp = Graph.flow(
        Graph.addNode({name: 'inner', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addEdge({from: '@inC1', to: '@outC'}),
        Graph.addEdge({from: '@inC2', to: 'inner@in'})
      )(Graph.compound({name: 'c', ports: [{port: 'inC1', kind: 'input'}, {port: 'inC2', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'inA', kind: 'input'}], componentId: 'moved'}),
        Graph.addNode(comp),
        Graph.addNode({ports: [{port: 'outF', kind: 'output'}]}),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0].id + '@outA', to: objs()[1].id + '@inC1'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0].id + '@outA', to: objs()[1].id + '@inC2'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: objs()[2].id + '@outF', to: objs()[0].id + '@inA'})(graph)
      )()
      var rewGraph1 = includePredecessor('c@inC1', graph)
      var rewGraph2 = includePredecessor('c@inC2', graph)
      expect(Graph.nodes(rewGraph1)).to.have.length(2)
      expect(Graph.nodes(Graph.node('c', rewGraph1))).to.have.length(2)
      expect(Node.inputPorts(Graph.node('c', rewGraph1))).to.have.length(1)
      expect(Graph.nodes(rewGraph2)).to.have.length(2)
      expect(Graph.nodes(Graph.node('c', rewGraph2))).to.have.length(2)
      expect(Node.inputPorts(Graph.node('c', rewGraph2))).to.have.length(1)
    })

    it('can add new outputs for predecessor successors that are not inside the compound', () => {
      var comp = Graph.flow(
        Graph.addEdge({from: '@inC', to: '@outC'}),
      )(Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'inA', kind: 'input'}], componentId: 'moved', name: 'moved'}),
        Graph.addNode(comp),
        Graph.addNode({ports: [{port: 'outF', kind: 'output'}]}),
        Graph.addNode({ports: [{port: 'inOther', kind: 'input'}], name: 'other'}),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0].id + '@outA', to: objs()[1].id + '@inC'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: objs()[2].id + '@outF', to: objs()[0].id + '@inA'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: 'moved@outA', to: 'other@inOther'})(graph)
      )()
      expect(Node.outputPorts(Graph.node('c', graph))).to.have.length(1)
      debug(graph)
      var rewGraph1 = includePredecessor('c@inC', graph)
      debug(rewGraph1)
      expect(Graph.nodes(rewGraph1)).to.have.length(3)
      expect(Graph.nodes(Graph.node('c', rewGraph1))).to.have.length(1)
      expect(Node.inputPorts(Graph.node('c', rewGraph1))).to.have.length(1)
      expect(Node.outputPorts(Graph.node('c', rewGraph1))).to.have.length(2)
    })

    it('can include a preceeding node whose ports all point to the compound', () => {
      var comp = Graph.flow(
        Graph.addNode({name: 'inner', ports: [{port: 'in', kind: 'input', type: 'a'}]}),
        Graph.addEdge({from: '@inC1', to: '@outC'}),
        Graph.addEdge({from: '@inC2', to: 'inner@in'})
      )(Graph.compound({name: 'c', ports: [{port: 'inC1', kind: 'input'}, {port: 'inC2', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'outB', kind: 'output'}, {port: 'inA', kind: 'input'}], componentId: 'moved'}),
        Graph.addNode(comp),
        Graph.addNode({ports: [{port: 'outF', kind: 'output'}]}),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0].id + '@outA', to: objs()[1].id + '@inC1'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0].id + '@outB', to: objs()[1].id + '@inC2'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: objs()[2].id + '@outF', to: objs()[0].id + '@inA'})(graph)
      )()
      var rewGraph1 = includePredecessor('c@inC1', graph)
      var rewGraph2 = includePredecessor('c@inC2', graph)
      expect(Graph.nodes(rewGraph1)).to.have.length(2)
      expect(Graph.nodes(Graph.node('c', rewGraph1))).to.have.length(2)
      expect(Node.inputPorts(Graph.node('c', rewGraph1))).to.have.length(1)
      expect(Graph.nodes(rewGraph2)).to.have.length(2)
      expect(Graph.nodes(Graph.node('c', rewGraph2))).to.have.length(2)
      expect(Node.inputPorts(Graph.node('c', rewGraph2))).to.have.length(1)
    })
  })

  describe('Excluding inner nodes', () => {
    it('moves a node out of an compound', () => {
      var comp = Graph.flow(
        Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'inA', kind: 'input'}], name: 'a'}),
        (graph, objs) =>
          Graph.addEdge({from: '@inC', to: objs()[0].id + '@inA'})(graph),
        (graph, objs) =>
          Graph.addEdge({to: '@outC', from: objs()[0].id + '@outA'})(graph)
      )(Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode({ports: [{port: 'outF', kind: 'output'}]}),
        Graph.addNode(comp),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0].id + '@outF', to: 'c@inC'})(graph)
      )()
      expect(Graph.nodes(graph)).to.have.length(2)
      var rewGraph = excludeNode('»c»a', graph)
      expect(Graph.nodes(rewGraph)).to.have.length(3)
      expect(Graph.predecessors('c@outA', rewGraph)).to.have.length(1)
      expect(Graph.node(Graph.predecessor('c@outA', rewGraph), rewGraph).name).to.equal('a')
      expect(Graph.node(Graph.successors('c@outA', rewGraph)[0], rewGraph).name).to.equal('c')
      expect(Graph.node(Graph.predecessor('c@outC', rewGraph), rewGraph).name).to.equal('c')
      expect(Node.hasPort('inC', Graph.node('c', rewGraph))).to.be.false
    })

    it('throws an error if the node has predecessors in the compound node', () => {
      var comp = Graph.flow(
        Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'inA', kind: 'input'}, {port: 'inB', kind: 'input'}], name: 'a'}),
        Graph.addNode({ports: [{port: 'outF', kind: 'output'}]}),
        (graph, objs) =>
          Graph.addEdge({from: objs()[1].id + '@outF', to: objs()[0].id + '@inA'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: '@inC', to: objs()[0].id + '@inB'})(graph)
      )(Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.addNode(comp, Graph.empty())
      expect(() => excludeNode('a', graph)).to.throw(Error)
    })
  })

  describe('Removing the compound boundaries completely', () => {
    it('Can process empty compounds', () => {
      var graph = Graph.addNode(
        Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}),
        Graph.empty())
      expect(Graph.nodes(unCompound('c', graph))).to.have.length(0)
    })

    it('moves all nodes out of an compound', () => {
      var comp = Graph.flow(
        Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'inA', kind: 'input'}], name: 'a'}),
        Graph.addNode({ports: [{port: 'outB', kind: 'output'}, {port: 'inB', kind: 'input'}], name: 'b'}),
        (graph, objs) =>
          Graph.addEdge({from: '@inC', to: 'a@inA'})(graph),
        (graph, objs) =>
          Graph.addEdge({to: 'b@inB', from: 'a@outA'})(graph),
        (graph, objs) =>
          Graph.addEdge({to: '@outC', from: 'b@outB'})(graph)
      )(Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      var graph = Graph.flow(
        Graph.addNode({ports: [{port: 'outF', kind: 'output'}]}),
        Graph.addNode({ports: [{port: 'inH', kind: 'input'}], name: 'h'}),
        Graph.addNode(comp),
        (graph, objs) =>
          Graph.addEdge({from: objs()[0].id + '@outF', to: 'c@inC'})(graph),
        (graph, objs) =>
          Graph.addEdge({from: 'c@outC', to: objs()[1].id + '@inH'})(graph)
      )()
      expect(Graph.nodes(graph)).to.have.length(3)
      var rewGraph = unCompound('c', graph)
      expect(Graph.nodes(rewGraph)).to.have.length(4)
      expect(Graph.predecessors('h', rewGraph)).to.have.length(1)
    })
  })

  it('Can replace nodes in compounds without affecting their edges', () => {
    var cmp = Graph.flow(
      Graph.addNode({
        name: 'Source',
        ports: [
          { port: 'out', kind: 'output', type: 'generic' }
        ]
      }),
      Graph.addNode({
        name: 'Sink',
        ports: [
          { port: 'in', kind: 'input', type: 'number' }
        ]
      }),
      Graph.addEdge({ from: 'Source@out', to: 'Sink@in' })
    )(Graph.compound({ }))
    var graph = Graph.addNode(cmp, Graph.empty())
    expect(Graph.edges(graph)).to.have.length(1)
    var node = Graph.nodesDeepBy((n) => n.name === 'Source', graph)[0]
    var newNode = _.cloneDeep(node)
    var newGraph = Graph.replaceNode(node, newNode, graph)
    expect(Graph.edges(newGraph)).to.have.length(1)
  })

  describe('Compoudify', () => {
    it('Can compoundify one node', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addEdge({from: 'a@out', to: 'b@in'}),
        Graph.addEdge({from: 'b@out', to: 'c@in'})
      )()
      const cmpd = compoundify(['b'], graph)
      expect(Graph.successors('a', cmpd)).to.have.length(1)
      expect(Graph.node(Graph.successors('a', cmpd)[0], cmpd).atomic).to.be.false
      expect(Graph.predecessors('c', cmpd)).to.have.length(1)
      expect(Graph.node(Graph.predecessors('c', cmpd)[0], cmpd).atomic).to.be.false
    })

    it('Can compoundify all nodes in a compound layer', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addEdge({from: 'a@out', to: 'b@in'}),
        Graph.addEdge({from: 'b@out', to: 'c@in'})
      )()
      const cmpd = compoundify(['b', 'a', 'c'], graph)
      expect(Graph.nodes(cmpd)).to.have.length(1)
      expect(Graph.nodes(Graph.nodes(cmpd)[0])).to.have.length(3)
    })

    it('Can compoundify all nodes in a compound layer with multiple ends', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'd', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addEdge({from: 'a@out', to: 'b@in'}),
        Graph.addEdge({from: 'b@out', to: 'c@in'}),
        Graph.addEdge({from: 'b@out', to: 'd@in'})
      )()
      const cmpd = compoundify(['b', 'a', 'c', 'd'], graph)
      expect(Graph.nodes(cmpd)).to.have.length(1)
      expect(Graph.nodes(Graph.nodes(cmpd)[0])).to.have.length(4)
    })

    it('Fails if the node is blocked', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
        Graph.addEdge({from: 'a@out', to: 'b@in'}),
        Graph.addEdge({from: 'b@out', to: 'c@in'})
      )()
      expect(() => compoundify(['a', 'c'], graph)).to.throw(Error)
    })
  })
})
