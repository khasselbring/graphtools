/* global describe, it */

import chai from 'chai'
import * as cmpdfy from '../src/compoundify.js'
import grlib from 'graphlib'
import fs from 'fs'
// import _ from 'lodash'

var expect = chai.expect

describe('Compoundification Property Check', () => {
  var simple = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/compoundify/simple.json')))
  it('empty subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simple, [])).to.be.true
  })

  it('single node in subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simple, ['b'])).to.be.true
  })

  it('all nodes in subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simple, ['a', 'b', 'c'])).to.be.true
  })

  it('space between nodes in subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simple, ['a', 'c'])).to.be.false
  })

  var diamond = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/compoundify/diamond.json')))
  it('all nodes in subset in diamond graph', () => {
    expect(cmpdfy.isCompoundable(diamond, ['a', 'b', 'c', 'd'])).to.be.true
  })

  it('two outputs in subset in diamond graph', () => {
    expect(cmpdfy.isCompoundable(diamond, ['a', 'b', 'c'])).to.be.true
  })

  it('hole in subset in diamond graph', () => {
    expect(cmpdfy.isCompoundable(diamond, ['a', 'b', 'd'])).to.be.false
  })

  it('not connected subset in diamond graph', () => {
    expect(cmpdfy.isCompoundable(diamond, ['a', 'd'])).to.be.false
  })

  var hexagon = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/compoundify/hexagon.json')))
  it('hole of two nodes in subset in hexagon graph', () => {
    expect(cmpdfy.isCompoundable(hexagon, ['a', 'b', 'd', 'f'])).to.be.false
  })

  it('two seperate parallels in subset in hexagon graph', () => {
    expect(cmpdfy.isCompoundable(hexagon, ['c', 'b', 'd', 'e'])).to.be.true
  })
})

// TODO: Unfinished
describe('Compoundification of Subset of Nodes', () => {
  var simple = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/compoundify/simple.json')))
  it('empty subset of simple graph', () => {
    cmpdfy.compoundify(simple, [])
  })
})
