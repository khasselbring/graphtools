/* global describe, it */

import chai from 'chai'
import * as utils from '../src/utils.js'
import grlib from 'graphlib'
import fs from 'fs'
import _ from 'lodash'

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

  it('can calculate the hierarchy levels between two nodes for higher distances', () => {
    var h = utils.rawHierarchyConnection(hGraph, hGraph.edges()[0])
    expect(h.filter((n) => n.type === 'out')).to.have.length(2)
    expect(h.filter((n) => n.type === 'in')).to.have.length(2)
    expect(_.map(h, 'node')).to.deep.equal(['a:b', 'a', 'd', 'd:e'])
  })

  it('recognizes port nodes', () => {
    expect(utils.isPortNode('a_PORT_b')).to.be.true
    expect(utils.isPortNode('a_PORT_b_PORT')).to.be.true
    expect(utils.isPortNode('a_PORT_b_PORT_c')).to.be.false
    expect(utils.isPortNode('apportation')).to.be.false
  })

  it('gets the corresponding node name for a port node', () => {
    expect(utils.portNodeName('a_PORT_b')).to.equal('a')
    expect(utils.portNodeName('multi_name_thing:with:stuff_PORT_and:stuff')).to.equal('multi_name_thing:with:stuff')
  })

  it('gets the port name for a port node', () => {
    expect(utils.portNodePort('a_PORT_b')).to.equal('b')
    expect(utils.portNodePort('multi_name_thing:with:stuff_PORT_and:stuff')).to.equal('and:stuff')
  })
})
