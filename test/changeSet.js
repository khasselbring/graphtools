/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet.js'
import * as Graph from '../src/graph'

var expect = chai.expect

describe('Change Sets', () => {
  it('can add new nodes', () => {
    var graph = Graph.empty()
    var cS = changeSet.insertNode({ id: 'a', prop: 'test' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.node(newGraph, 'a')).to.be.ok
    expect(Graph.node(newGraph, 'a').prop).to.equal('test')
  })

  it('can set a field in a node', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(),
      changeSet.insertNode({id: 'a', prop: 'test'}))
    var cS = changeSet.updateNode('a', { NEW_PROP: 'test' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.node(newGraph, 'a').NEW_PROP).to.equal('test')
  })

  it('can update a field in a node', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(),
      changeSet.insertNode({id: 'a', prop: 'test'}))
    var cS = changeSet.updateNode('a', { prop: 'new_test' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.node(newGraph, 'a').prop).to.equal('new_test')
  })

  it('can remove a node', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(),
      changeSet.insertNode({id: 'a', prop: 'test'}))
    var cS = changeSet.removeNode('a')
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.nodes(newGraph)).to.have.length(0)
  })

  it('can insert a new edge', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a'}),
      changeSet.insertNode({id: 'b'})
    ])
    var cS = changeSet.insertEdge({ from: 'a', to: 'b' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.edges(newGraph)).to.have.length(1)
  })

  it('can remove an edge', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a'}),
      changeSet.insertNode({id: 'b'}),
      changeSet.insertEdge({ from: 'a', to: 'b' })
    ])
    var cS = changeSet.removeEdge({ from: 'a', to: 'b' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.edges(newGraph)).to.have.length(0)

    graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a'}),
      changeSet.insertNode({id: 'b'}),
      changeSet.insertEdge({ from: 'a', to: 'b' }),
      changeSet.insertEdge({ from: 'c', to: 'd' })
    ])
    cS = changeSet.removeEdge({ from: 'c', to: 'd' })
    newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.edges(newGraph)).to.have.length(1)
    expect(Graph.edges(newGraph)[0]).to.eql({ from: 'a', to: 'b' })
  })

  it('can add meta keys', () => {
    var graph = Graph.empty()
    var newGraph = changeSet.applyChangeSet(graph, changeSet.addMetaInformation({metaID: 'ABC'}))
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph).metaID).to.equal('ABC')
  })

  it('can update meta keys', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.addMetaInformation({metaID: 'ABC'}))
    const cS = changeSet.addMetaInformation({metaID: 'DEF'})
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph).metaID).to.equal('DEF')
  })

  it('can apply multiple change sets', () => {
    var graph = Graph.empty()
    var newGraph = changeSet.applyChangeSets(graph, [
      changeSet.addMetaInformation({metaID: 'ABC'}),
      changeSet.addMetaInformation({name: 'test'})
    ])
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph)).to.have.property('name')
  })
})
