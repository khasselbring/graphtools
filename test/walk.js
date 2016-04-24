/* global describe, it */

import chai from 'chai'
import * as walk from '../src/walk.js'
import grlib from 'graphlib'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import fs from 'fs'
import _ from 'lodash'

var expect = chai.expect
chai.use(sinonChai)

describe('Adjacent nodes', () => {
  var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.graphlib')))
  it('can get the predecessor of a node', () => {
    var pred = walk.predecessor(pGraph1, '2_STDOUT', 'input')
    expect(pred).to.deep.equal(['1_INC'])
  })

  var pGraph3 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/partial.json')))
  it('`predecessor` returns the correct neighbors for inPort-name = outPort-name', () => {
    var preds = walk.predecessor(pGraph3, 'p', 'fn')
    expect(preds).to.have.length(1)
    expect(preds[0]).to.equal('l')
  })

  it('can get the successor of a node', () => {
    var pred = walk.successor(pGraph1, '0_STDIN', 'output')
    expect(pred).to.deep.equal(['1_INC'])
  })

  var doubleInGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_double_in.graphlib')))
  it('can get multiple predecessors from one port', () => {
    var pred = walk.predecessor(doubleInGraph, '2_STDOUT', 'input')
    expect(pred).to.have.length(2)
    expect(pred).to.include('0_STDIN')
    expect(pred).to.include('1_STDIN')
  })

  var doubleOutGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_double_out.graphlib')))
  it('can get multiple successor from one port', () => {
    var pred = walk.successor(doubleOutGraph, '0_STDIN', 'output')
    expect(pred).to.have.length(2)
    expect(pred).to.include('1_STDOUT')
    expect(pred).to.include('2_STDOUT')
  })

  it('`adjacentNode` returns edgeFollow result', () => {
    var pred = walk.adjacentNode(pGraph1, '0_STDIN', 'output', () => ['NEXT_NODE'])
    expect(pred).to.deep.equal(['NEXT_NODE'])
  })

  it('`adjacentNode` can use successor function', () => {
    var succ = walk.adjacentNode(pGraph1, '0_STDIN', 'output', walk.successor)
    expect(succ).to.deep.equal(['1_INC'])
  })

  it('`adjacentNode` returns undefined if path does not exists', () => {
    var succ = walk.adjacentNode(pGraph1, '0_STDIN', 'a', walk.successor)
    expect(succ).to.be.undefined
  })

  var pGraph2 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.graphlib')))
  it('`adjacentNodes` can process multiple ports', () => {
    var preds = walk.adjacentNodes(pGraph2, '3_ADD', ['s1', 's2'], walk.predecessor)
    expect(preds).to.have.length(2)
    expect(preds[0]).to.have.length(1)
    expect(preds[1]).to.have.length(1)
    expect(_.flatten(preds)).to.include('4_CONST1')
    expect(_.flatten(preds)).to.include('1_INC')
  })

  it('`adjacentNodes` removes not usable paths', () => {
    var preds = walk.adjacentNodes(pGraph2, '3_ADD', ['s1', '-'], walk.predecessor)
    expect(preds).to.have.length(2)
    expect(preds[0]).to.deep.equal(['1_INC'])
  })
})

describe('Graph walks', () => {
  var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.graphlib')))
  it('can walk forward through a given path', () => {
    var path = walk.walk(pGraph1, '0_STDIN', ['output', 'inc'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('can walk backward through a given path', () => {
    var path = walk.walkBack(pGraph1, '2_STDOUT', ['input', 'i'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  var pGraph2 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.graphlib')))
  it('can walk through over a compound node', () => {
    var path = walk.walk(pGraph2, '0_STDIN', ['output', 'inc'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('can walk into a compound node', () => {
    var path = walk.walk(pGraph2, '0_STDIN', ['output', 'i'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '3_ADD'])
  })

  it('returns empty array if the path does not exist', () => {
    var path = walk.walk(pGraph2, '0_STDIN', ['a'])
    expect(path).to.have.length(0)
  })

  it('can follow multiple paths', () => {
    var path = walk.walkBack(pGraph2, '3_ADD', [['s1', 's2']])
    expect(path).to.have.length(2)
    expect(path[0][0]).to.be.oneOf(['1_INC', '4_CONST1'])
    expect(path[1][0]).to.be.oneOf(['1_INC', '4_CONST1'])
  })

  it('can follow a path given by a function', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('output')
    cb.onCall(1).returns('inc')
    var path = walk.walk(pGraph1, '0_STDIN', cb)
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('returns an empty array if the path given by a function does not exist', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('a')
    var path = walk.walk(pGraph1, '0_STDIN', cb)
    expect(path).to.have.length(0)
  })

  it('gives a valid node object to the path function', () => {
    walk.walk(pGraph1, '0_STDIN', (graph, node) => {
      expect(graph).to.be.ok
      expect(node).to.be.a('string')
      if (node === '0_STDIN') return 'output'
    })
  })

  it('can follow multiple paths via a function', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns(['s1', 's2'])
    var path = walk.walkBack(pGraph2, '3_ADD', cb)
    expect(path).to.have.length(2)
    expect(path[0][0]).to.be.oneOf(['1_INC', '4_CONST1'])
    expect(path[1][0]).to.be.oneOf(['1_INC', '4_CONST1'])
  })
})
