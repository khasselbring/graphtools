/* global describe, it */

import chai from 'chai'
import {backtrackNetworkGraph, backtrackPortGraph} from '../src/backtrack.js'
import grlib from 'graphlib'
import fs from 'fs'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import _ from 'lodash'

var expect = chai.expect
chai.use(sinonChai)

describe('Backtracking', () => {
  var nGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/testgraph0_generics.graphlib')))
  it('`backtrackNetworkGraph` bactrack calls callback once for the node', () => {
    var cb = sinon.spy()
    backtrackNetworkGraph(nGraph, '2_DEMUX', cb)
    expect(cb).to.be.calledOnce
  })

  it('`backtrackNetworkGraph` calls the callback with an empty object the first time', () => {
    var cb = sinon.spy()
    backtrackNetworkGraph(nGraph, '2_DEMUX', cb)
    expect(cb).to.be.calledWith('2_DEMUX', nGraph.node('2_DEMUX'))
  })

  it('`backtrackNetworkGraph` the callback specifies the backtrack path', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns([{port: 'input', payload: undefined}])
    cb.onCall(1).returns([{port: 'control', payload: undefined}])
    backtrackNetworkGraph(nGraph, '4_STDOUT', cb)
    expect(cb).to.be.calledThrice
  })

  it('`backtrackNetworkGraph` the backtracking follows only generic types', () => {
    backtrackNetworkGraph(nGraph, '2_DEMUX', (id, node, payload) => {
      expect(node.id).to.be.oneOf(['math/const1', 'logic/demux'])
      // console.log(payload)
      if (_.invertBy(node.inputPorts)['generic'] === undefined) {
        return []
      }
      // return [ {port: name, payload: [node]}]
      return _.invertBy(node.inputPorts)['generic'].map((port) => ({port: port, payload: _.concat(payload || [], [node])}))
    })
  })

  var pGraph = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.graphlib')))
  it('`backtrackPortGraph` the callback specifies the backtrack path', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns([{port: 'input', payload: undefined}])
    cb.onCall(1).returns([{port: 'i', payload: undefined}])
    backtrackPortGraph(pGraph, '4_STDOUT', cb)
    expect(cb).to.be.calledThrice
  })

  it('`backtrackPortGraph` returns a path to the end points', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns([{port: 'input', payload: undefined}])
    cb.onCall(1).returns([{port: 'i', payload: undefined}])
    var endPoints = backtrackPortGraph(pGraph, '4_STDOUT', cb)
    expect(endPoints).to.have.length(1)
    expect(endPoints[0].path).to.have.length(3)
  })
})
