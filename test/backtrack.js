/* global describe, it */

import chai from 'chai'
import backtrack from '../src/backtrack.js'
import grlib from 'graphlib'
import fs from 'fs'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import _ from 'lodash'

var expect = chai.expect
chai.use(sinonChai)

describe('Backtracking', () => {
  var graph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/testgraph0_generics.graphlib')))
  it('bactrack calls callback', () => {
    var cb = sinon.spy()
    backtrack(graph, '2_DEMUX', cb)
    expect(cb).to.be.calledOnce
  })

  it('calls the callback with an empty object the first time', () => {
    var cb = sinon.spy()
    backtrack(graph, '2_DEMUX', cb)
    expect(cb).to.be.calledWith(graph.node('2_DEMUX'), {})
  })

  it('the callback specifies the backtrack path', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns([{port: 'input', payload: {}}])
    cb.onCall(1).returns([{port: 'control', payload: {}}])
    backtrack(graph, '4_STDOUT', cb)
    expect(cb).to.be.calledThrice
  })

  it('the backtracking follows only generic types', () => {
    backtrack(graph, '2_DEMUX', (node, payload) => {
      expect(node.id).to.be.oneOf(['math/const1', 'logic/demux'])
      // console.log(payload)
      if (_.invertBy(node.inputPorts)['generic'] === undefined) {
        return []
      }
      // return [ {port: name, payload: [node]}]
      return _.invertBy(node.inputPorts)['generic'].map((port) => ({port: port, payload: _.concat(payload || [], [node])}))
    })
  })
})
