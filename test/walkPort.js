/* global describe, it */

import chai from 'chai'
import * as walk from '../src/walkPort.js'
import grlib from 'graphlib'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import fs from 'fs'
import _ from 'lodash'

var expect = chai.expect
chai.use(sinonChai)

describe('Adjacent nodes', () => {
  var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/testgraph0_generics.graphlib')))
  it('can get the predecessor of a node', () => {
    var pred = walk.predecessor(pGraph1, '3_STDOUT', 'input')
    expect(pred).to.deep.equal(['2_DEMUX'])
  })

  it('can get the output-port of the predecessor of a node', () => {
    var pred = walk.predecessorPort(pGraph1, '3_STDOUT', 'input')
    expect(pred).to.deep.equal(['outTrue'])
  })

  it('does get the input port for a not connected hierarchy port', () => {
    var aGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/apply.json')))
    var pred = walk.predecessorPort(aGraph, 'inc_lambda:add', 's1')
    expect(pred).to.have.length(1)
  })

  it('can get the successor of a node', () => {
    var pred = walk.successor(pGraph1, '0_CONST1', 'const1')
    expect(pred).to.deep.equal(['2_DEMUX'])
  })

  var doubleInGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/graph_double_in.graphlib')))
  it('can get multiple predecessors from one port', () => {
    var pred = walk.predecessor(doubleInGraph, '2_STDOUT', 'input')
    expect(pred).to.have.length(2)
    expect(pred).to.include('0_STDIN')
    expect(pred).to.include('1_STDIN')
  })

  var doubleOutGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/graph_double_out.graphlib')))
  it('can get multiple successor from one port', () => {
    var pred = walk.successor(doubleOutGraph, '0_STDIN', 'output')
    expect(pred).to.have.length(2)
    expect(pred).to.include('1_STDOUT')
    expect(pred).to.include('2_STDOUT')
  })

  it('`adjacentNode` returns edgeFollow result', () => {
    var pred = walk.adjacentNode(pGraph1, '0_CONST1', 'const1', () => ['NEXT_NODE'])
    expect(pred).to.deep.equal(['NEXT_NODE'])
  })

  it('`adjacentNode` can use successor function', () => {
    var succ = walk.adjacentNode(pGraph1, '0_CONST1', 'const1', walk.successor)
    expect(succ).to.deep.equal(['2_DEMUX'])
  })

  it('`adjacentNode` returns undefined if path does not exists', () => {
    var succ = walk.adjacentNode(pGraph1, '0_CONST1', 'a', walk.successor)
    expect(succ).to.be.undefined
  })

  it('`adjacentNodes` can process multiple ports', () => {
    var preds = walk.adjacentNodes(pGraph1, '2_DEMUX', ['input', 'control'], walk.predecessor)
    expect(preds).to.have.length(2)
    expect(preds[0]).to.have.length(1)
    expect(preds[1]).to.have.length(1)
    expect(_.flatten(preds)).to.include('0_CONST1')
    expect(_.flatten(preds)).to.include('1_CONST2')
  })

  it('`adjacentNodes` removes not usable paths', () => {
    var preds = walk.adjacentNodes(pGraph1, '2_DEMUX', ['input', '-'], walk.predecessor)
    expect(preds).to.have.length(1)
    expect(preds[0]).to.deep.equal(['0_CONST1'])
  })
})

describe('Graph walks', () => {
  var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/testgraph0_generics.graphlib')))
  it('can walk forward through a given path', () => {
    var path = walk.walk(pGraph1, '0_CONST1', ['const1', 'outTrue'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_CONST1', '2_DEMUX', '3_STDOUT'])
  })

  it('can walk backward through a given path', () => {
    var path = walk.walkBack(pGraph1, '3_STDOUT', ['input', 'control'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['1_CONST2', '2_DEMUX', '3_STDOUT'])
  })

  it('returns empty array if the path does not exist', () => {
    var path = walk.walk(pGraph1, '0_CONST1', ['a'])
    expect(path).to.have.length(0)
  })

  it('can follow multiple paths', () => {
    var path = walk.walkBack(pGraph1, '2_DEMUX', [['control', 'input']])
    expect(path).to.have.length(2)
    expect(path[0][0]).to.be.oneOf(['0_CONST1', '1_CONST2'])
    expect(path[1][0]).to.be.oneOf(['0_CONST1', '1_CONST2'])
  })

  it('can follow a path given by a function', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('const1')
    cb.onCall(1).returns('outFalse')
    var path = walk.walk(pGraph1, '0_CONST1', cb)
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_CONST1', '2_DEMUX', '4_STDOUT'])
  })

  it('creates paths correctly', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('input')
    var path = walk.walkBack(pGraph1, '2_DEMUX', cb)
    expect(path).to.have.length(1)
    expect(path[0][0]).to.be.a('string')
  })

  it('returns the starting node if no path is found', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns([])
    var path = walk.walk(pGraph1, '0_CONST1', cb)
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_CONST1'])
  })

  it('returns an empty array if the path given by a function does not exist', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('a')
    var path = walk.walk(pGraph1, '0_CONST1', cb)
    expect(path).to.have.length(0)
  })

  it('gives a valid node object to the path function', () => {
    walk.walk(pGraph1, '0_CONST1', (graph, node) => {
      expect(graph).to.be.ok
      expect(node).to.be.a('string')
    })
  })

  it('can follow multiple paths via a function', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns(['input', 'control'])
    var path = walk.walkBack(pGraph1, '2_DEMUX', cb)
    expect(path).to.have.length(2)
    expect(path[0][0]).to.be.oneOf(['0_CONST1', '1_CONST2'])
    expect(path[1][0]).to.be.oneOf(['0_CONST1', '1_CONST2'])
  })
})
