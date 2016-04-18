/* global describe, it */

import chai from 'chai'
import * as norm from '../src/normalization.js'
import grlib from 'graphlib'
import fs from 'fs'
// import _ from 'lodash'

var expect = chai.expect

describe('Graph Normalization', () => {
  var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/partial.json')))
  it('can recognize a graph that has only conform edges', () => {
    expect(norm.hasConformEdges(pGraph1)).to.be.true
  })

  var pGraph2 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/partial_apply.json')))
  it('can recognize a graph that has non-conform edges', () => {
    expect(norm.hasConformEdges(pGraph2)).to.be.false
  })

  it('can return a list of non-conform edges', () => {
    var edges = norm.nonConformEdges(pGraph2)
    expect(edges).to.have.length(1)
    expect(pGraph2.edge(edges[0])).to.be.ok
  })
})
