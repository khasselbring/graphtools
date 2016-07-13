/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet.js'
import * as io from '../src/io.js'
import _ from 'lodash'
import {empty} from '../src/graph'

var expect = chai.expect

describe('Change Sets', () => {
  it('can apply set a field in nodes', () => {
    var graph = io.jsonFromFile('test/fixtures/real_add.json')
    var cS = changeSet.updateNode(graph.nodes[0].v, {NEW_PROP: 'test'})
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.nodes[0].value.NEW_PROP).to.equal('test')
  })

  it('can add new nodes', () => {
    var graph = empty()
    var cS = changeSet.insertNode('a', {prop: 'test'})
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.nodes[0].v).to.equal('a')
    expect(newGraph.nodes[0].value.prop).to.equal('test')
  })

  it('can insert a new edge', () => {
    var graph = io.jsonFromFile('test/fixtures/real_add.json')
    var cS = changeSet.insertEdge({v: 'test', w: 'test2'})
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(_.last(newGraph.edges)).to.eql({v: 'test', w: 'test2'})
  })

  it('can remove an edge', () => {
    var graph = io.jsonFromFile('test/fixtures/real_add.json')
    var edgesCnt = graph.edges.length
    var cS = changeSet.removeEdge({ v: 'numToStr_PORT_output', w: 'out_PORT_input' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.edges.length).to.equal(edgesCnt - 1)
  })

  it('can add meta keys', () => {
    var graph = io.jsonFromFile('test/fixtures/real_add.json')
    var nodeCnt = graph.nodes.length
    const cS = changeSet.addMetaInformation('version', '0.0.0')
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.nodes.length).to.equal(nodeCnt + 1)
    expect(newGraph.nodes[nodeCnt].value).to.equal('0.0.0')
  })

  it('can update meta keys', () => {
    var graph = io.jsonFromFile('test/fixtures/real_add.json')
    const cS1 = changeSet.addMetaInformation('version', '0.0.0')
    graph = changeSet.applyChangeSet(graph, cS1)
    var nodeCnt = graph.nodes.length
    const cS2 = changeSet.addMetaInformation('version', '0.1.0')
    var newGraph = changeSet.applyChangeSet(graph, cS2)
    expect(newGraph.nodes.length).to.equal(nodeCnt)
    expect(newGraph.nodes[nodeCnt - 1].value).to.equal('0.1.0')
  })

  it('can apply multiple change sets', () => {
    var graph = empty()
    var newGraph = changeSet.applyChangeSets(graph, [
      changeSet.addMetaInformation('version', '0.1.0'),
      changeSet.addMetaInformation('name', 'test')
    ])
    expect(newGraph.nodes).to.have.length(2)
  })
})
