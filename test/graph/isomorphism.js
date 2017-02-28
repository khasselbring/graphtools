/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../../src/graph'
import * as Compound from '../../src/compound'

var expect = chai.expect

describe('Basic graph functions', () => {
  describe('Isomorph graphs', () => {
    it('Empty graphs are isomorph', () => {
      expect(Graph.isomorph(Graph.empty(), Graph.empty())).to.be.true
    })

    describe('Self-isomorphism', () => {
      it('An empty graph is isomorph to itself', () => {
        const empty = () => Graph.empty()
        expect(Graph.isomorph(empty(), empty())).to.be.true
      })

      it('Graphs are not isomorph if their root is different', () => {
        const r1 = () => Compound.addInputPort({port: 'a', type: 'b'}, Graph.empty())
        const r2 = () => Compound.addOutputPort({port: 'a', type: 'b'}, Graph.empty())
        const r3 = (r2) => Compound.addInputPort({port: 'a2', type: 'c'}, r2)
        expect(Graph.isomorph(r1(), r1()), 'Recognizes input ports of root nodes').to.be.true
        expect(Graph.isomorph(r2(), r2()), 'Recognizes output ports of root nodes').to.be.true
        expect(Graph.isomorph(r3(r2()), r3(r2())), 'Does not confuse input and output ports').to.be.true
      })

      it('Recognizes nodes inside a compound', () => {
        const g = () => Graph.flow(
          Graph.addNode({name: 'a', atomic: true, ports: [{port: 'a', kind: 'output', type: 'a'}, {port: 'b', kind: 'input', type: 'c'}]}),
          Graph.addEdge({from: 'a@a', to: '@b'})
        )(Graph.compound({ports: [{port: 'b', kind: 'output', type: 'a'}]}))
        const g2 = (g) => Graph.flow(
          Compound.addInputPort({port: 'c', type: 'c'}),
          Graph.addEdge({from: '@c', to: 'a@b'})
        )(g)

        expect(Graph.isomorph(g(), g())).to.be.true
        expect(Graph.isomorph(g2(g()), g2(g()))).to.be.true
      })

      it('Recursively compares compounds', () => {
        const c1 = () => Graph.flow(
          Graph.addNode({name: 'a', atomic: true, ports: [{port: 'a', kind: 'output', type: 'a'}]}),
          Graph.addEdge({from: 'a@a', to: '@b'})
        )(Graph.compound({ports: [{port: 'b', kind: 'output', type: 'a'}]}))
        const c2 = () => Graph.flow(
          Graph.letFlow(Graph.addNode(c1()), (newNode, graph) => 
            Graph.addEdge({from: newNode.id + '@a', to: '@b'}))
        )(Graph.compound({ports: [{port: 'b', kind: 'output', type: 'a'}]}))
        const g = () => Graph.flow(
          Graph.letFlow(Graph.addNode(c2()), (newNode, graph) =>
            Graph.addEdge({from: newNode.id + '@a', to: '@b'}))
        )(Graph.compound({ports: [{port: 'b', kind: 'output', type: 'a'}]}))

        expect(Graph.isomorph(g(), g())).to.be.true
      })
    })

    describe('Non-isomorph graphs', () => {
      it('Graphs are not isomorph if their root is different', () => {
        const r1 = Compound.addInputPort({port: 'a', type: 'b'}, Graph.empty())
        const r2 = Graph.empty()
        const r3 = Compound.addOutputPort({port: 'a', type: 'b'}, Graph.empty())
        const r4 = Compound.addInputPort({port: 'a', type: 'c'}, Graph.empty())
        expect(Graph.isomorph(r1, r2), 'Second graph has no ports at the root node').to.be.false
        expect(Graph.isomorph(r1, r3), 'Second graph has an output port but no input port').to.be.false
        expect(Graph.isomorph(r1, r4), 'Second graph has an input port with a different type').to.be.false
      })

      const graphWithComponent = (name) =>
        Graph.flow(
          Graph.addNode({componentId: name, name: 'a', atomic: true, ports: [{port: 'a', kind: 'output', type: 'a'}, {port: 'b', kind: 'input', type: 'c'}]}),
          Graph.addEdge({from: 'a@a', to: '@b'})
        )(Graph.compound({ports: [{port: 'b', kind: 'output', type: 'a'}]}))

      it('ComponentIDs matter for isomorphisms', () => {
        const g1 = graphWithComponent('a')
        const g1Other = graphWithComponent('a')
        const g2 = graphWithComponent('b')

        expect(Graph.isomorph(g1, g1Other)).to.be.true
        expect(Graph.isomorph(g1, g2)).to.be.false
      })

      it('Detects different edge topology', () => {
        const g = () => Graph.flow(
          Graph.addNode({name: 'a', atomic: true, ports: [{port: 'a', kind: 'output', type: 'a'}, {port: 'b', kind: 'input', type: 'c'}]}),
          Graph.addEdge({from: 'a@a', to: '@b'})
        )(Graph.compound({ports: [{port: 'b', kind: 'output', type: 'a'},
          {port: 'c1', kind: 'input', type: 'c'}, {port: 'c2', kind: 'input', type: 'c'}]}))
        const g2 = (g) => Graph.flow(
          Graph.addEdge({from: '@c1', to: 'a@b'})
        )(g)
        const g3 = (g) => Graph.flow(
          Graph.addEdge({from: '@c2', to: 'a@b'})
        )(g)

        expect(Graph.isomorph(g2(g()), g3(g()))).to.be.false
      })
    })
  })
})
