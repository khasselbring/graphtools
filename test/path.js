/* global describe, it */

import chai from 'chai'
import * as path from '../src/path.js'
import grlib from 'graphlib'
import fs from 'fs'
// import _ from 'lodash'

var expect = chai.expect

describe('Path tools', () => {
  describe('Path splitting', () => {
    it('can recognize a graph that has only conform edges', () => {
      var ack = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/ack.json')))
      expect(path.latestSplit(ack,
        ['defco_ack', 'defco_ack:add_1', 'defco_ack:mux_0'],
        ['defco_ack', 'defco_ack:add_9', 'defco_ack:ack_8', 'defco_ack:mux_3']))
        .to.equal(0)
    })

    it('can returns the last node if both paths lead to the same port', () => {
      var ack = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/ack.json')))
      expect(path.latestSplit(ack,
        ['defco_ack', 'defco_ack:ack_11', 'defco_ack:ack_8', 'defco_ack:mux_3'],
        ['defco_ack', 'defco_ack:add_9', 'defco_ack:ack_8', 'defco_ack:mux_3']))
        .to.equal(3)
    })

    it('can returns undefined if both paths have no common nodes', () => {
      var ack = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/ack.json')))
      expect(path.latestSplit(ack,
        ['defco_ack:const(1)_2', 'defco_ack:add_1', 'defco_ack:mux_0'],
        ['defco_ack', 'defco_ack:add_9', 'defco_ack:ack_8', 'defco_ack:mux_3']))
        .to.equal(-1)
    })
  })
})
