/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet.js'
import * as graphAPI from '../src/graph.js'
import _ from 'lodash'

var expect = chai.expect

describe.only('Change Sets', () => {
  it('can apply set a field in nodes', () => {
    var graph = graphAPI.jsonFromFile('test/fixtures/real_add.json')
    var cS = changeSet.updateNode(graph.nodes[0].v, {NEW_PROP: 'test'})
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.nodes[0].value.NEW_PROP).to.equal('test')
  })

  it('can insert a new edge', () => {
    var graph = graphAPI.jsonFromFile('test/fixtures/real_add.json')
    var cS = changeSet.insertEdge({v: 'test', w: 'test2'})
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(_.last(newGraph.edges)).to.eql({v: 'test', w: 'test2'})
  })

  it('can remove an edge', () => {
    var graph = graphAPI.jsonFromFile('test/fixtures/real_add.json')
    var edgesCnt = graph.edges.length
    var cS = changeSet.removeEdge({ v: 'numToStr_PORT_output', w: 'out_PORT_input' })
    var newGraph = changeSet.applyChangeSet(graph, cS)
    expect(newGraph.edges.length).to.equal(edgesCnt - 1)
  })
})
