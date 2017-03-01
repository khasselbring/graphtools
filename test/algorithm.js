/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../src/graph'
import * as Algorithms from '../src/algorithm'
import * as Node from '../src/node'
import fs from 'fs'

const expect = chai.expect

describe('Graph Algorithms', () => {
  describe('Topological sort', () => {
    it('Can sort the empty graph', () => {
      var graph = Graph.empty()
      expect(Algorithms.topologicalSort(graph)).to.eql([])
    })

    it('Returns an element of a graph with one node', () => {
      var graph = Graph.addNode({name: 'a', ports: [{port: 'outA', kind: 'output'}]}, Graph.empty())
      expect(Algorithms.topologicalSort(graph).map(Node.name)).to.eql(['a'])
    })

    it('Returns nodes in a sequential order', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'outA', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'inB', kind: 'input'}, {port: 'outB', kind: 'output'}]}),
        Graph.addNode({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}),
        Graph.addEdge({from: 'a@outA', to: 'b@inB'}),
        Graph.addEdge({from: 'b@outB', to: 'c@inC'})
      )()
      expect(Algorithms.topologicalSort(graph).map(Node.name)).to.eql(['a', 'b', 'c'])
    })

    it('Can work with multiple starting nodes', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'outA', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'outB', kind: 'output'}]}),
        Graph.addNode({name: 'c', ports: [{port: 'inC1', kind: 'input'}, {port: 'inC2', kind: 'input'}]}),
        Graph.addEdge({from: 'a@outA', to: 'c@inC1'}),
        Graph.addEdge({from: 'b@outB', to: 'c@inC2'})
      )()
      expect(Algorithms.topologicalSort(graph).map(Node.name)[2]).to.eql('c')
    })

    it('Throws an error if the graph has a loop', () => {
      var graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'outA', kind: 'output'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'inB', kind: 'input'}, {port: 'outB', kind: 'output'}]}),
        Graph.addNode({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}),
        Graph.addEdge({from: 'a@outA', to: 'b@inB'}),
        Graph.addEdge({from: 'b@outB', to: 'c@inC'}),
        Graph.addEdge({from: 'c@outC', to: 'b@inB'})
      )()
      expect(() => Algorithms.topologicalSort(graph)).to.throw(Error)
    })

    it('Can sort compound nodes', () => {
      var comp = Graph.flow(
        Graph.Let(Graph.addNode({ports: [{port: 'outA', kind: 'output'}, {port: 'inA', kind: 'input'}], name: 'a'}),
          (node, graph) =>
            Graph.flow(
              Graph.addEdge({from: '@inC', to: node.id + '@inA'}),
              Graph.addEdge({to: '@outC', from: node.id + '@outA'})
            )(graph))
      )(Graph.compound({name: 'c', ports: [{port: 'inC', kind: 'input'}, {port: 'outC', kind: 'output'}]}))
      expect(Algorithms.topologicalSort(comp).map(Node.name)).to.eql(['a'])
    })

    it('Can sort the thread example', () => {
      var graph = Graph.fromJSON(JSON.parse(fs.readFileSync('./test/fixtures/print-thread-co.json', 'utf8')))
      expect(Algorithms.topologicalSort(graph).map(Node.component)).to.eql(['thread'])
      expect(Algorithms.topologicalSort(Graph.node('/thread', graph)).map(Node.component)).to.eql(['std/const', 'print'])
    })
  })
})
