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

    it('Removes reference if the lambda implementation is replaces by component', () => {
      var l = Lambda.createLambda({name: 'ref', ref: 'X'}, {name: 'lambda'})
      var graph = Graph.flow(
        Graph.addNode(l),
        Graph.replaceNode('»lambda»ref', Node.create({name: 'ref', componentId: 'ref', ports: [{port: 'a', kind: 'output', type: 'a'}]}))
      )()
      expect(Graph.node('»lambda»ref', graph).ref).to.not.be.ok
    })

    it('Should be impossible to add a node to a lambda node', () => {
      var l = Lambda.createLambda({name: 'ref', ref: 'X'}, {name: 'lambda'})
      var graph = Graph.flow(
        Graph.addNode(l),
      )()
      expect(() => Graph.addNodeIn('»lambda', {name: 'ref2', ref: 'Y'}, graph)).to.throw(Error)
    })

    it('Should be impossible to remove the implementation of a node lambda node', () => {
      var l = Lambda.createLambda({name: 'ref', ref: 'X'}, {name: 'lambda'})
      var graph = Graph.flow(
        Graph.addNode(l),
      )()
      expect(() => Graph.removeNode('»lambda»ref', graph)).to.throw(Error)
    })

    it('Should update edges inside a lambda node', () => {
      var impl = Graph.flow(
        Graph.addNode({ref: 'X', name: 'inner'}),
        Graph.addNode({ref: 'Y', name: 'inner2'}),
        Graph.addEdge({from: 'inner@0', to: 'inner2@0'})
      )(Graph.compound({name: 'cmp', ports: [{port: 'out', kind: 'output', type: 'generic'}]}))
      var l = Lambda.createLambda(impl, {name: 'lambda'})
      var graph = Graph.flow(
        Graph.addNode(l)
      )()
      expect(Graph.successors('/X', graph)).to.have.length(1)
    })
  })
})
