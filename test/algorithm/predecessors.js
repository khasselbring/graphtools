/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../../src/graph'
import * as Algorithms from '../../src/algorithm/algorithms'
import * as Node from '../../src/node'

const expect = chai.expect

describe('Graph Algorithms', () => {
  describe('» Predecessors', () => {
    it('» Finds all predecessor of a node', () => {
      const graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in1', kind: 'input', type: 'g'}, {port: 'in2', kind: 'input', type: 'g'}]}),
        Graph.addEdge({from: 'a@out', to: 'b@in1'}),
        Graph.addEdge({from: 'a@out', to: 'b@in2'})
      )()
      expect(Algorithms.predecessors(['b'], graph).map(Node.name)).to.eql(['a'])
    })

    it('» Finds indirect predecessors', () => {
      const graph = Graph.flow(
        Graph.addNode({name: 'a1', ports: [{port: 'out', kind: 'output', type: 'g'}]}),
        Graph.addNode({name: 'a2', ports: [{port: 'out', kind: 'output', type: 'g'}]}),
        Graph.addNode({
          name: 'c1',
          ports: [
            {port: 'out1', kind: 'output', type: 'g'},
            {port: 'in1', kind: 'input', type: 'g'},
            {port: 'in2', kind: 'input', type: 'g'}
          ]}),
        Graph.addNode({
          name: 'c2',
          ports: [
            {port: 'out1', kind: 'output', type: 'g'},
            {port: 'in1', kind: 'input', type: 'g'},
            {port: 'in2', kind: 'input', type: 'g'}
          ]}),
        Graph.addNode({name: 'b', ports: [{port: 'in1', kind: 'input', type: 'g'}, {port: 'in2', kind: 'input', type: 'g'}]}),
        Graph.addEdge({from: 'a1@out', to: 'c1@in1'}),
        Graph.addEdge({from: 'a1@out', to: 'c2@in1'}),
        Graph.addEdge({from: 'a2@out', to: 'c1@in2'}),
        Graph.addEdge({from: 'a2@out', to: 'c2@in2'}),
        Graph.addEdge({from: 'c1@out1', to: 'b@in1'}),
        Graph.addEdge({from: 'c2@out1', to: 'b@in2'})
      )()
      const lcas = Algorithms.predecessors('b', graph).map(Node.name)
      expect(lcas).to.have.length(4)
      expect(lcas).to.include('a1')
      expect(lcas).to.include('c1')
      expect(lcas).to.include('c2')
      expect(lcas).to.include('a2')
    })

    it('» Stops predecessor search on an element in the given subset', () => {
      const graph = Graph.flow(
        Graph.addNode({name: 'a1', ports: [{port: 'out', kind: 'output', type: 'g'}]}),
        Graph.addNode({name: 'a2', ports: [{port: 'out', kind: 'output', type: 'g'}]}),
        Graph.addNode({
          name: 'c1',
          ports: [
            {port: 'out1', kind: 'output', type: 'g'},
            {port: 'in1', kind: 'input', type: 'g'},
            {port: 'in2', kind: 'input', type: 'g'}
          ]}),
        Graph.addNode({
          name: 'c2',
          ports: [
            {port: 'out1', kind: 'output', type: 'g'},
            {port: 'in1', kind: 'input', type: 'g'},
            {port: 'in2', kind: 'input', type: 'g'}
          ]}),
        Graph.addNode({name: 'b', ports: [{port: 'in1', kind: 'input', type: 'g'}, {port: 'in2', kind: 'input', type: 'g'}]}),
        Graph.addEdge({from: 'a1@out', to: 'c1@in1'}),
        Graph.addEdge({from: 'a1@out', to: 'c2@in1'}),
        Graph.addEdge({from: 'a2@out', to: 'c1@in2'}),
        Graph.addEdge({from: 'a2@out', to: 'c2@in2'}),
        Graph.addEdge({from: 'c1@out1', to: 'b@in1'}),
        Graph.addEdge({from: 'c2@out1', to: 'b@in2'})
      )()
      const lcas = Algorithms.predecessorsUpTo('b', ['c1'], graph).map(Node.name)
      expect(lcas).to.have.length(3)
      expect(lcas).to.include('a1')
      expect(lcas).to.include('c2')
      expect(lcas).to.include('a2')
    })
  })
})
