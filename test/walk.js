/* global describe, it */

import chai from 'chai'
import * as Graph from '../src/graph'
import * as walk from '../src/walk.js'
import * as Convert from '../src/conversion'
import grlib from 'graphlib'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import fs from 'fs'
import _ from 'lodash'
import omitDeep from 'omit-deep-lodash'

var expect = chai.expect
chai.use(sinonChai)

const noParent = _.partial(omitDeep, _, 'parent')

describe('Adjacent nodes', () => {
  var pGraph1 = Graph.empty()
    .addNode({id: '2_STDOUT', ports: [{name: 'input', kind: 'input', type: 'a'}]})
    .addNode({id: '1_INC', ports: [{name: 'inc', kind: 'output', type: 'a'}]})
    .addEdge({from: '1_INC@inc', to: '2_STDOUT@input'})

  it('can get the predecessor of a node for', () => {
    var pred = walk.predecessor(pGraph1, '2_STDOUT', 'input')
    expect(noParent(pred)).to.deep.equal([{node: '1_INC', port: 'inc',
      edge: {from: '1_INC', outPort: 'inc', to: '2_STDOUT', inPort: 'input', layer: 'dataflow'}}])
  })

  it('can get the successor of a node for', () => {
    var pred = walk.successor(pGraph1, '1_INC', 'inc')
    expect(noParent(pred)).to.deep.equal([{node: '2_STDOUT', port: 'input',
      edge: {from: '1_INC', outPort: 'inc', to: '2_STDOUT', inPort: 'input', layer: 'dataflow'}}])
  })

  var doubleOut =
    Graph.addEdge(
    Graph.addNode(pGraph1, {id: '3_STDOUT', ports: [{name: 'input', kind: 'input', type: 'a'}]}),
    { from: '1_INC@inc', to: '3_STDOUT@input' })

  it('can get multiple successor from one port', () => {
    var succ = walk.successor(doubleOut, '1_INC', 'inc')
    expect(succ).to.have.length(2)
    expect(noParent(succ)).to.deep.include({node: '2_STDOUT', port: 'input',
      edge: {from: '1_INC', outPort: 'inc', to: '2_STDOUT', inPort: 'input', layer: 'dataflow'}})
    expect(noParent(succ)).to.deep.include({node: '3_STDOUT', port: 'input',
      edge: {from: '1_INC', outPort: 'inc', to: '3_STDOUT', inPort: 'input', layer: 'dataflow'}})
  })

  it('`adjacentNode` returns edgeFollow result', () => {
    var pred = walk.adjacentNode(pGraph1, '0_STDIN', 'output', () => ['NEXT_NODE'])
    expect(pred).to.deep.equal(['NEXT_NODE'])
  })

  it('`adjacentNode` can use successor function', () => {
    var succ = walk.adjacentNode(pGraph1, '1_INC', 'inc', walk.successor)
    expect(noParent(succ)).to.deep.equal([{node: '2_STDOUT', port: 'input',
      edge: {from: '1_INC', outPort: 'inc', to: '2_STDOUT', inPort: 'input', layer: 'dataflow'}}])
  })

  it('`adjacentNode` returns undefined if path does not exists', () => {
    var succ = walk.adjacentNode(pGraph1, '1_INC', 'a', walk.successor)
    expect(succ).to.be.undefined
  })

  var incGraph = Graph.compound({id: 'inc', ports: [{name: 'i', kind: 'input', type: 'a'}, {name: 'inc', kind: 'output', type: 'a'}]})
    .addNode({id: 'const', ports: [{name: 'output', kind: 'output', type: 'a'}]})
    .addNode({id: 'add', ports: [{name: 's1', kind: 'input', type: 'a'}, {name: 's2', kind: 'input', type: 'a'}, {name: 'sum', kind: 'output', type: 'a'}]})
    .addEdge({from: 'const@output', to: 'add@s2'})
    .addEdge({from: 'add@sum', to: '@inc'})
    .addEdge({from: '@i', to: 'add@s1'})

  var cmpGraph = Graph.empty()
    .addNode(incGraph)
    .addNode({id: 'stdout', ports: [{name: 'input', kind: 'input', type: 'a'}]})
    .addEdge({from: 'inc@inc', to: 'stdout@input'})

  it('`adjacentNode` can handle compound nodes', () => {
    var preds = walk.adjacentNodes(incGraph, 'add', 's1', walk.predecessor)
    expect(preds).to.have.length(1)
    expect(noParent(preds[0])).to.deep.equal({node: 'inc', port: 'i', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
    var succs = walk.adjacentNodes(incGraph, 'inc', 'i', walk.successor)
    expect(succs).to.have.length(1)
    expect(noParent(succs[0])).to.deep.equal({node: 'add', port: 's1', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
  })

  it('`adjacentNodes` can process multiple ports', () => {
    var preds = walk.adjacentNodes(incGraph, 'add', ['s1', 's2'], walk.predecessor)
    expect(preds).to.have.length(2)
    expect(noParent(preds)).to.deep.include({node: 'const', port: 'output', edge: {from: 'const', outPort: 'output', to: 'add', inPort: 's2', layer: 'dataflow'}})
    expect(noParent(preds)).to.deep.include({node: 'inc', port: 'i', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
  })

  it('`adjacentNodes` removes not usable paths', () => {
    var preds = walk.adjacentNodes(incGraph, 'add', ['s1', '-'], walk.predecessor)
    expect(preds).to.have.length(1)
    expect(noParent(preds[0])).to.deep.equal({node: 'inc', port: 'i', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
  })
})
/* missing file.. not committed...
describe('Graph walks', () => {
  var pGraph1 = Convert.fromGraphlib(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.graphlib'))))
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

  var pGraph2 = Convert.fromGraphlib(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.graphlib'))))
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
    var mapG = Convert.fromGraphlib(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/map.ports.json'))))
    var path = walk.walkBack(mapG, 'arrToStr', ['input', 'result'])
    expect(path).to.have.length(1)
    expect(path).to.deep.equal([['mapInc:apply', 'mapInc', 'arrToStr']])
  })

  it('can walk through a map correctly', () => {
    var mapG = Convert.fromGraphlib(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/map.ports.json'))))
    var paths = walk.walkBack(mapG, 'arrToStr', ['input', 'result', ['fn', 'data']], {keepPorts: true})
    expect(paths).to.have.length(2)
  })
})
*/
