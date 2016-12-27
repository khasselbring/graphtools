/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet.js'
import * as Graph from '../src/graph'

var expect = chai.expect

describe('Change Sets', () => {
  it('can add new nodes', () => {
    var graph = Graph.empty()
    var cS = changeSet.insertNode({ id: 'a', ports: [{port: 'test', kind: 'output', type: 'number'}], prop: 'test' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.nodes[0]).to.be.ok
    expect(newGraph.nodes[0].prop).to.equal('test')
  })

  it('can set a field in a node', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(),
      changeSet.insertNode({id: 'a', ports: [{port: 'a', kind: 'output', type: 'number'}], prop: 'test'}))
    var cS = changeSet.updateNode('a', { NEW_PROP: 'test' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.nodes[0].NEW_PROP).to.equal('test')
  })

  it('can update a field in a node', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(),
      changeSet.insertNode({id: 'a', ports: [{port: 'a', kind: 'output', type: 'number'}], prop: 'test'}))
    var cS = changeSet.updateNode('a', { prop: 'new_test' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.nodes[0].prop).to.equal('new_test')
  })

  it('can remove a node', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(),
      changeSet.insertNode({id: 'a', ports: [{port: 'a', kind: 'output', type: 'number'}], prop: 'test'}))
    var cS = changeSet.removeNode('a')
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.nodes(newGraph)).to.have.length(0)
  })

  it('can insert a new edge', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a', ports: [{port: 'a', kind: 'output', type: 'number'}]}),
      changeSet.insertNode({id: 'b', ports: [{port: 'a', kind: 'output', type: 'number'}]})
    ])
    var cS = changeSet.insertEdge({ from: 'a', to: 'b' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.edges(newGraph)).to.have.length(1)
  })

  it('can remove an edge', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a', ports: [{port: 'a', kind: 'output', type: 'number'}]}),
      changeSet.insertNode({id: 'b', ports: [{port: 'a', kind: 'input', type: 'number'}]}),
      changeSet.insertEdge({ from: 'a', to: 'b', layer: 'c' })
    ])
    var cS = changeSet.removeEdge({ from: 'a', to: 'b', layer: 'c' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.edges(newGraph)).to.have.length(0)

    graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a', ports: [{port: 'a', kind: 'output', type: 'number'}]}),
      changeSet.insertNode({id: 'b', ports: [{port: 'a', kind: 'input', type: 'number'}]}),
      changeSet.insertNode({id: 'c', ports: [{port: 'a', kind: 'output', type: 'number'}]}),
      changeSet.insertNode({id: 'd', ports: [{port: 'a', kind: 'input', type: 'number'}]}),
      changeSet.insertEdge({ from: {node: 'a', port: 'a'}, to: {node: 'b', port: 'a'}, layer: 'dataflow' }),
      changeSet.insertEdge({ from: {node: 'c', port: 'a'}, to: {node: 'd', port: 'a'}, layer: 'dataflow' })
    ])
    cS = changeSet.removeEdge({ from: {node: 'c', port: 'a'}, to: {node: 'd', port: 'a'}, layer: 'dataflow' })
    newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.edges(newGraph)).to.have.length(1)
    expect(Graph.edges(newGraph)[0].from.node).to.eql('a')
  })

  it('can set meta information', () => {
    var graph = Graph.empty()
    var newGraph = changeSet.applyChangeSet(graph, changeSet.setMetaInformation({metaID: 'ABC'}))
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph).metaID).to.equal('ABC')
  })

  it('can add meta keys', () => {
    var graph = Graph.empty()
    var newGraph = changeSet.applyChangeSet(graph, changeSet.addMetaInformation('metaID', 'ABC'))
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph).metaID).to.equal('ABC')
  })

  it('can update meta information', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.setMetaInformation({metaID: 'ABC'}))
    const cS = changeSet.setMetaInformation({metaID: 'DEF'})
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph).metaID).to.equal('DEF')
  })

  it('can update meta keys', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.setMetaInformation({metaID: 'ABC'}))
    const cS = changeSet.addMetaInformation('metaID', 'DEF')
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph).metaID).to.equal('DEF')
  })

  it('can apply multiple change sets', () => {
    var graph = Graph.empty()
    var newGraph = changeSet.applyChangeSets(graph, [
      changeSet.setMetaInformation({metaID: 'ABC'}),
      changeSet.addMetaInformation('name', 'test')
    ])
    expect(Graph.meta(newGraph)).to.have.property('metaID')
    expect(Graph.meta(newGraph)).to.have.property('name')
  })

  it.only('can update a component in the graph', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertComponent({componentId: 'A'}),
      changeSet.updateComponent('A', {isType: true})
    ])
    expect(graph.components[0]).to.have.property('isType')
    expect(graph.components[0].isType).to.be.true
  })
})
