/* global describe, it */

import chai from 'chai'
import * as rewrite from '../src/rewrites.js'
import grlib from 'graphlib'
import fs from 'fs'
// import _ from 'lodash'

var expect = chai.expect

describe('Graph rewrites', () => {
  it('adds a single nodes', () => {
    var graph = new grlib.Graph({directed: true, compound: true})
    graph.setNode('a', {})
    var resGraph = rewrite.apply(graph, 'a', {nodes: [{v: 'b'}], edges: []})
    expect(resGraph.nodes()).to.include('a:b')
    expect(resGraph.nodes()).to.include('a')
  })

  it('adds multiple nodes', () => {
    var graph = new grlib.Graph({directed: true, compound: true})
    graph.setNode('a', {})
    var resGraph = rewrite.apply(graph, 'a', {nodes: [{v: 'b'}, {v: 'c'}], edges: []})
    expect(resGraph.nodes()).to.include('a:b')
    expect(resGraph.nodes()).to.include('a:c')
    expect(resGraph.nodes()).to.include('a')
  })

  it('can add edges from a change-set', () => {
    var graph = new grlib.Graph({directed: true, compound: true})
    graph.setNode('a', {})
    var resGraph = rewrite.apply(graph, 'a',
      {
        nodes: [
          {v: 'b', value: {outputPorts: {i: 'type'}}},
          {v: 'c', value: {inputPorts: {o: 'type'}}}
        ],
        edges: [
          {v: 'b', w: 'c', value: {inPort: 'i', outPort: 'o'}}
        ]
      })
    console.log(resGraph.edges())
    expect(resGraph.nodeEdges('a:b')).to.have.length(1)
  })

  it('keeps all old edges', () => {
    var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.graphlib')))
    var resGraph = rewrite.apply(pGraph1, '1_INC', {nodes: [{v: 'b'}], edges: []})
    expect(resGraph.nodeEdges('0_STDIN')).to.have.length(1)
    expect(resGraph.nodeEdges('1_INC')).to.have.length(2)
    expect(resGraph.nodeEdges('1_INC:b')).to.have.length(0)
    expect(resGraph.nodeEdges('2_STDOUT')).to.have.length(1)
  })

  it('renames all rewritten edges', () => {
    var graph = new grlib.Graph({directed: true, compound: true})
    graph.setNode('a', {})
    var resGraph = rewrite.apply(graph, 'a', {nodes: [{v: 'b'}, {v: 'c'}], edges: [{v: 'b', w: 'c'}]})
    expect(resGraph.nodeEdges('a:b')).to.have.length(1)
    expect(resGraph.nodeEdges('a:c')).to.have.length(1)
  })
})
