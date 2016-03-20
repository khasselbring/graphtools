/* global describe, it */

import chai from 'chai'
import * as utils from '../src/utils.js'
import grlib from 'graphlib'
import fs from 'fs'
// import _ from 'lodash'

var expect = chai.expect

describe('Graph utilities', () => {
  var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/partial_apply.json')))
  it('can return the (compound) hierarchy of a node', () =>{
    var h = utils.hierarchy(pGraph1, 'a:add')
    expect(h).to.have.length(2)
    expect(h[0]).to.equal('a')
    expect(h[1]).to.equal('a:add')
  })

  it('can calculate the hierarchy levels between two nodes', () => {
    var h = utils.hierarchyConnection(pGraph1, {v: 'c', w: 'a:add'})
    expect(h).to.have.length(1)
  })

  var hGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/hierarchy.json')))
  it('can calculate the hierarchy levels between two nodes for higher distances', () => {
    var h = utils.hierarchyConnection(hGraph, hGraph.edges()[0])
    expect(h).to.deep.equal(['a:b', 'a', 'd', 'd:e'])
  })
})
