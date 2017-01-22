/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../../src/graph'
import * as Node from '../../src/node'
import * as Lambda from '../../src/functional/lambda'
import _ from 'lodash'

var expect = chai.expect

describe('Basic graph functions', () => {
  describe('Lambda functions', () => {
    it('Can use lambda functions in a graph', () => {
      var l = Lambda.createLambda({name: 'a', ref: 'X'}, {name: 'lambda'})
      var graph = Graph.flow(
        Graph.addNode(l)
      )()
      expect(Graph.hasNode('lambda', graph)).to.be.true
      expect(Graph.hasNode('»lambda»a', graph)).to.be.true
    })

    it('Works with compound nodes inside as a lambda function', () => {
      var impl = Graph.flow(
        Graph.addNode({ref: 'X', name: 'inner'})
      )(Graph.compound({name: 'cmp', ports: [{port: 'out', kind: 'output', type: 'generic'}]}))
      var l = Lambda.createLambda(impl, {name: 'lambda'})
      var graph = Graph.flow(
        Graph.addNode(l)
      )()
      expect(Graph.hasNode('»lambda»cmp', graph)).to.be.true
      expect(Graph.hasNode('»lambda»cmp»inner', graph)).to.be.true
    })

    it('Replaces nodes inside lambdas correctly', () => {
      var l = Lambda.createLambda({name: 'ref', ref: 'X'}, {name: 'lambda'})
      var graph = Graph.flow(
        Graph.addNode(l),
        Graph.replaceNode('»lambda»ref', Node.create({name: 'ref', ports: [{port: 'a', kind: 'output', type: 'a'}]}))
      )()
      expect(Graph.hasNode('»lambda»ref', graph)).to.be.true
      var ref = Graph.node('»lambda»ref', graph)
      expect(ref).to.have.property('ports')
      expect(ref.ports).to.have.length(1)
      expect(ref.ports[0].port).to.equal('a')
      expect(Graph.hasNode(ref.path, graph)).to.be.true
    })
  })
})
