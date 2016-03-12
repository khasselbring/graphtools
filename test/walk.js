/* global describe, it */

import chai from 'chai'
import {walk, walkBack} from '../src/walk.js'
import grlib from 'graphlib'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import fs from 'fs'
// import _ from 'lodash'

var expect = chai.expect
chai.use(sinonChai)

describe('Graph walks', () => {
  var pGraph1 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.graphlib')))
  it('can walk forward through a given path', () => {
    var path = walk(pGraph1, '0_STDIN', ['output', 'inc'])
    expect(path).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('can walk backward through a given path', () => {
    var path = walkBack(pGraph1, '2_STDOUT', ['input', 'i'])
    expect(path).to.deep.equal(['2_STDOUT', '1_INC', '0_STDIN'])
  })

  var pGraph2 = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.graphlib')))
  it('can walk through over a compound node', () => {
    var path = walk(pGraph2, '0_STDIN', ['output', 'inc'])
    expect(path).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('can walk through into a compound node', () => {
    var path = walk(pGraph2, '0_STDIN', ['output', 'i'])
    expect(path).to.deep.equal(['0_STDIN', '1_INC', '3_ADD'])
  })

  it('can follow a path given by a function', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('output')
    cb.onCall(1).returns('inc')
    var path = walk(pGraph1, '0_STDIN', cb)
    expect(path).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })
})
