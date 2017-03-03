/* global describe, it */

import chai from 'chai'
import * as Graph from '../../src/graph'
import * as Functional from '../../src/rewrite/functional'
import {debug} from '../../src/debug'
import _ from 'lodash'

var expect = chai.expect

describe('Rewrite basic API', () => {
  describe('» Functional', () => {
    describe('Creating Lambda nodes for subsets', () => {
      it('Can put compounds into lambda nodes', () => {
        var graph = Graph.flow(
          Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addEdge({from: 'a@out', to: 'b@in'}),
          Graph.addEdge({from: 'b@out', to: 'c@in'})
        )()
        const fn = Functional.convertToLambda(['b', 'a'], graph)
        expect(Graph.hasNode('/functional/lambda', fn)).to.be.true
      })
    })

    describe('» Converting subsets into function calls', () => {
      it('Can create a lambda function out of an compound with matching call', () => {
        var graph = Graph.flow(
          Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addEdge({from: 'a@out', to: 'b@in'}),
          Graph.addEdge({from: 'b@out', to: 'c@in'})
        )()
        debug(graph)
        const fn = Functional.replaceByCall(['b', 'a'], graph)
        expect(Graph.hasNode('/functional/lambda', fn)).to.be.true
        expect(Graph.hasNode('/functional/call', fn)).to.be.true
      })

      it('Can create a lambda function out of an compound with one input partial', () => {
        var graph = Graph.flow(
          Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addEdge({from: 'a@out', to: 'b@in'}),
          Graph.addEdge({from: 'b@out', to: 'c@in'})
        )()
        debug(graph)
        const fn = Functional.replaceByCall(['b'], graph)
        expect(Graph.hasNode('/functional/lambda', fn)).to.be.true
        expect(Graph.hasNode('/functional/call', fn)).to.be.true
        expect(Graph.hasNode('/functional/partial', fn)).to.be.true
      })

      it('Can create a lambda function out of an compound with multiple input partials', () => {
        var graph = Graph.flow(
          Graph.addNode({name: 'a1', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'a2', ports: [{port: 'out', kind: 'output', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'b', ports: [{port: 'out', kind: 'output', type: 'g'}, {port: 'in1', kind: 'input', type: 'g'}, {port: 'in2', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addNode({name: 'c', ports: [{port: 'in', kind: 'input', type: 'g'}], atomic: true}),
          Graph.addEdge({from: 'a1@out', to: 'b@in1'}),
          Graph.addEdge({from: 'a2@out', to: 'b@in2'}),
          Graph.addEdge({from: 'b@out', to: 'c@in'})
        )()
        const fn = Functional.replaceByCall(['b'], graph)
        expect(Graph.hasNode('/functional/lambda', fn)).to.be.true
        expect(Graph.hasNode('/functional/call', fn)).to.be.true
        expect(Graph.hasNode('/functional/partial', fn)).to.be.true
        expect(Graph.nodes(fn)).to.have.length(7)
      })
    })
  })
})