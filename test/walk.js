/* global describe, it */

import chai from 'chai'
import * as walk from '../src/walk.js'
import {normalize} from '@buggyorg/dupjoin'
import {remodelPorts} from '@buggyorg/npg-port-remodeler'
import grlib from 'graphlib'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import fs from 'fs'
import _ from 'lodash'

var expect = chai.expect
chai.use(sinonChai)

function testSetting (setting, preprocess) {
  if (preprocess === undefined) {
    preprocess = (x) => x
  }

  describe('Adjacent nodes for ' + setting, () => {
    var pGraph1 = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.graphlib'))))
    it('can get the predecessor of a node for', () => {
      var pred = walk.predecessor(pGraph1, '2_STDOUT', 'input')
      expect(pred).to.deep.equal([{node: '1_INC', port: 'inc', edge: {from: '1_INC', outPort: 'inc', to: '2_STDOUT', inPort: 'input'}}])
    })

    var pGraph3 = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/partial.json'))))
    it('`predecessor` returns the correct neighbors for inPort-name = outPort-name', () => {
      var preds = walk.predecessor(pGraph3, 'p', 'fn')
      expect(preds).to.have.length(1)
      expect(preds[0]).to.deep.equal({node: 'l', port: 'fn', edge: {from: 'l', outPort: 'fn', to: 'p', inPort: 'fn'}})
    })

    it('can get the successor of a node', () => {
      var pred = walk.successor(pGraph1, '0_STDIN', 'output')
      expect(pred).to.deep.equal([{node: '1_INC', port: 'i', edge: {from: '0_STDIN', outPort: 'output', to: '1_INC', inPort: 'i'}}])
    })

    var doubleInGraph = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_double_in.graphlib'))))
    it('can get multiple predecessors from one port', () => {
      var pred = walk.predecessor(doubleInGraph, '2_STDOUT', 'input')
      expect(pred).to.have.length(2)
      expect(pred).to.deep.include({node: '0_STDIN', port: 'output', edge: {from: '0_STDIN', outPort: 'output', to: '2_STDOUT', inPort: 'input'}})
      expect(pred).to.deep.include({node: '1_STDIN', port: 'output', edge: {from: '1_STDIN', outPort: 'output', to: '2_STDOUT', inPort: 'input'}})
    })

    var doubleOutGraph = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_double_out.graphlib'))))
    it('can get multiple successor from one port', () => {
      var succ = walk.successor(doubleOutGraph, '0_STDIN', 'output')
      expect(succ).to.have.length(2)
      expect(succ).to.deep.include({node: '1_STDOUT', port: 'input', edge: {from: '0_STDIN', outPort: 'output', to: '1_STDOUT', inPort: 'input'}})
      expect(succ).to.deep.include({node: '2_STDOUT', port: 'input', edge: {from: '0_STDIN', outPort: 'output', to: '2_STDOUT', inPort: 'input'}})
    })

    it('`adjacentNode` returns edgeFollow result', () => {
      var pred = walk.adjacentNode(pGraph1, '0_STDIN', 'output', () => ['NEXT_NODE'])
      expect(pred).to.deep.equal(['NEXT_NODE'])
    })

    it('`adjacentNode` can use successor function', () => {
      var succ = walk.adjacentNode(pGraph1, '0_STDIN', 'output', walk.successor)
      expect(succ).to.deep.equal([{node: '1_INC', port: 'i', edge: {from: '0_STDIN', outPort: 'output', to: '1_INC', inPort: 'i'}}])
    })

    it('`adjacentNode` returns undefined if path does not exists', () => {
      var succ = walk.adjacentNode(pGraph1, '0_STDIN', 'a', walk.successor)
      expect(succ).to.be.undefined
    })

    var pGraph2 = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.graphlib'))))
    it('`adjacentNode` can handle compound nodes', () => {
      var preds = walk.adjacentNodes(pGraph2, '3_ADD', 's1', walk.predecessor)
      expect(preds).to.have.length(1)
      expect(preds[0]).to.deep.equal({node: '1_INC', port: 'i', edge: {from: '1_INC', outPort: 'i', to: '3_ADD', inPort: 's1'}})
    })

    it('`adjacentNodes` can process multiple ports', () => {
      var preds = walk.adjacentNodes(pGraph2, '3_ADD', ['s1', 's2'], walk.predecessor)
      expect(preds).to.have.length(2)
      expect(preds).to.deep.include({node: '4_CONST1', port: 'const1', edge: {from: '4_CONST1', outPort: 'const1', to: '3_ADD', inPort: 's2'}})
      expect(preds).to.deep.include({node: '1_INC', port: 'i', edge: {from: '1_INC', outPort: 'i', to: '3_ADD', inPort: 's1'}})
    })

    it('`adjacentNodes` removes not usable paths', () => {
      var preds = walk.adjacentNodes(pGraph2, '3_ADD', ['s1', '-'], walk.predecessor)
      expect(preds).to.have.length(1)
      expect(preds[0]).to.deep.equal({node: '1_INC', port: 'i', edge: {from: '1_INC', outPort: 'i', to: '3_ADD', inPort: 's1'}})
    })
  })

  describe('Graph walks for ' + setting, () => {
    var pGraph1 = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.graphlib'))))
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

    var pGraph2 = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.graphlib'))))
    it('can walk over a compound node', () => {
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
      cb.onCall(2).returns([])
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
      cb.onCall(1).returns([])
      cb.onCall(2).returns([])
      var path = walk.walkBack(pGraph2, '3_ADD', cb)
      expect(path).to.have.length(2)
      expect(path[0][0]).to.be.oneOf(['1_INC', '4_CONST1'])
      expect(path[1][0]).to.be.oneOf(['1_INC', '4_CONST1'])
    })

    it('calls the walk callback with the graph, node and port', () => {
      var cb = sinon.stub()
      cb.calledWith(pGraph2, '0_STDIN', 'output')
      walk.walkBack(pGraph2, '1_INC', cb)
    })

    it('can follows a path into a generic', () => {
      var mapG = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/map.ports.json'))))
      var path = walk.walkBack(mapG, 'arrToStr', ['input', 'result'])
      expect(path).to.have.length(1)
      expect(path).to.deep.equal([['mapInc:apply', 'mapInc', 'arrToStr']])
    })

    it('can walk through a map correctly', () => {
      var mapG = preprocess(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/map.ports.json'))))
      var paths = walk.walkBack(mapG, 'arrToStr', ['input', 'result', ['fn', 'data']], {keepPorts: true})
      expect(paths).to.have.length(2)
    })

    if (setting === 'network graphs') {
      it('can walk out of recursive map correctly', () => {
        var mapG = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/map_recursive.json')))
        var paths = walk.walkBack(mapG, 'mapInc', ['data'], {keepPorts: true})
        expect(paths).to.have.length(1)
        expect(paths[0]).to.have.length(2)
      })

      /* it.only('can walk through recursive map correctly', () => {
        var mapG = grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/map_recursive.1.json')))
        var paths = walk.walkBack(mapG, {node: 'mapInc', port: 'result'}, (graph, node, port) => {
          if (node === 'mapInc' && port === 'data') {
            return 'data'
          }
          switch (node) {
            case 'mapInc':
              return ['result']
            case 'mapInc:join':
              return ['in1', 'in2']
            case 'mapInc:term':
              return ['input']
            case 'mapInc:prep':
              return ['value']
            case 'mapInc:strToArr':
              return []
            case 'mapInc:apply':
              return []
          }
        }, {keepPorts: true})
        expect(paths).to.have.length(2)
      })*/
    }
  })
}

testSetting('network port graphs')
testSetting('network graphs', (graph) => remodelPorts(normalize(graph)))
