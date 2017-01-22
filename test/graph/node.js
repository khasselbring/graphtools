/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../../src/changeSet'
import * as Graph from '../../src/graph'
import * as Node from '../../src/node'
import {port} from '../../src/port'
import _ from 'lodash'
import semver from 'semver'

var expect = chai.expect

const toNames = (graph) => (id) => Node.name(Graph.node(id, graph))

describe('Basic graph functions', () => {
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
})
