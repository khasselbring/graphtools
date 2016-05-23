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

  it('not existing node in subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simple, ['z'])).to.be.false
  })

  it('all nodes in subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simple, ['a', 'b', 'c'])).to.be.true
  })

  it('space between nodes in subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simple, ['a', 'c'])).to.be.false
  })

  var simpleDif = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/compoundify/simple.json')))
  simpleDif.setNode('par')
  simpleDif.setParent('a', 'par')
  it('different parents in subset of simple graph', () => {
    expect(cmpdfy.isCompoundable(simpleDif, ['a', 'b'])).to.be.false
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

describe('Compoundification of Subset of Nodes', () => {
  var simple = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/compoundify/simple.json')))
  it('impossible subset of simple graph', () => {
    expect(() => cmpdfy.compoundify(simple, ['a', 'c'])).to.throw(Error)
  })

  it('empty subset of simple graph', () => {
    var graph = cmpdfy.compoundify(simple, [])
    expect(graph).to.deep.equal(simple)
  })

  it('unary subset of simple graph', () => {
    var graph = cmpdfy.compoundify(simple, ['b'])
    expect(graph.nodes().length).to.equal(4)
    expect(graph.parent('b')).to.not.be.undefined
    expect(graph.parent('a')).to.be.undefined
  })

  it('possible subset of simple graph', () => {
    var graph = cmpdfy.compoundify(simple, ['b', 'a'])
    expect(graph.nodes().length).to.equal(4)
    expect(graph.parent('a')).to.not.be.undefined
    expect(graph.parent('b')).to.not.be.undefined
    expect(graph.parent('c')).to.be.undefined
  })
})
