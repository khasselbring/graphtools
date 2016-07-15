/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet'
import * as Graph from '../src/graph'
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

  it('fails if a non existend node is queried', () => {
    expect(() => Graph.node(Graph.empty(), 'a')).to.throw(Error)
  })

  it('get all nodes', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a'}),
      changeSet.insertNode({id: 'b'})
    ])
    expect(Graph.nodes(graph)).to.have.length(2)
  })

  it('adds nodes to the graph', () => {
    var graph = Graph.addNode(Graph.empty(), {id: 'a'})
    expect(Graph.hasNode(graph, 'a')).to.be.true
  })

  it('should throw an error if the node data is not valid', () => {
    expect(() => Graph.addNode(Graph.empty())).to.throw(Error)
    expect(() => Graph.addNode(Graph.empty(), {})).to.throw(Error)
  })

  it('should throw an error if an node gets added twice', () => {
    var graph = Graph.addNode(Graph.empty(), {id: 'a'})
    expect(() => Graph.addNode(graph, {id: 'a', prop: 'p'})).to.throw(Error)
  })

  it('can set the parent of a node', () => {
    var graph = Graph.addNode(
      Graph.addNode(Graph.empty(), {id: 'a'}), {id: 'b'})
    Graph.setParent(graph, 'b', 'a')
    expect(Graph.node(graph, 'b').parent).to.equal('a')
  })

  it('can check whether a node exists in the graph', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a'}),
      changeSet.insertNode({id: 'b'})
    ])
    expect(Graph.hasNode(graph, 'a')).to.be.true
    expect(Graph.hasNode(graph, {id: 'b'})).to.be.true
  })

  it('does not include meta information', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.addMetaInformation({a: 'b'}))
    expect(Graph.nodes(graph)).to.have.length(0)
  })

  it('returns a map of all meta information', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.addMetaInformation({a: 'b'}))
    var meta = Graph.meta(graph)
    expect(meta).to.be.an('object')
    expect(meta).to.have.property('a')
    expect(meta.a).to.equal('b')
  })
})
