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

describe.skip('Adjacent nodes', () => {
  var pGraph1 = () => Graph.flow(
    Graph.addNode({name: '2_STDOUT', ports: [{port: 'input', kind: 'input', type: 'a'}]}),
    Graph.addNode({name: '1_INC', ports: [{port: 'inc', kind: 'output', type: 'a'}]}),
    Graph.addEdge({from: '1_INC@inc', to: '2_STDOUT@input'})
  )()

  it('can get the predecessor of a node for', () => {
    var pred = walk.predecessor('2_STDOUT', 'input', pGraph1())
    expect(pred).to.have.length(1)
    expect(pred[0].port).to.deep.equal({node: '1_INC', port: 'inc'})
    expect(pred[0].edge.from).to.deep.equal({node: '1_INC', port: 'inc'})
    expect(pred[0].edge.to).to.deep.equal({node: '2_STDOUT', port: 'input'})
  })

  it('can get the successor of a node for', () => {
    var pred = walk.successor('1_INC', 'inc', pGraph1())
    expect(pred).to.have.length(1)
    expect(pred[0].port).to.deep.equal({node: '2_STDOUT', port: 'input'})
    expect(pred[0].edge.from).to.deep.equal({node: '1_INC', port: 'inc'})
    expect(pred[0].edge.to).to.deep.equal({node: '2_STDOUT', port: 'input'})
  })

  var doubleOut = () => Graph.flow(
    Graph.addNode(pGraph1(), {name: '3_STDOUT', ports: [{port: 'input', kind: 'input', type: 'a'}]}),
    Graph.addEdge({from: '1_INC@inc', to: '3_STDOUT@input'})
  )(pGraph1())

  it('can get multiple successor from one port', () => {
    var succ = walk.successor('1_INC', 'inc', doubleOut())
    expect(succ).to.have.length(2)
    expect(succ[0].from).to.deep.be.oneOf([{node: '2_STDOUT', port: 'input'}, {node: '3_STDOUT', port: 'input'}])
    expect(succ[1].from).to.deep.be.oneOf([{node: '2_STDOUT', port: 'input'}, {node: '3_STDOUT', port: 'input'}])
  })

  it('`adjacentNode` returns edgeFollow result', () => {
    var pred = walk.adjacentNode('0_STDIN', 'output', () => ['NEXT_NODE'], pGraph1())
    expect(pred).to.deep.equal(['NEXT_NODE'])
  })

  it('`adjacentNode` can use successor function', () => {
    var succ = walk.adjacentNode('1_INC', 'inc', walk.successor, pGraph1())
    expect(succ).to.have.length(1)
    expect(succ.port[0]).to.deep.equal({node: '2_STDOUT', port: 'input'})
  })

  it('`adjacentNode` returns undefined if path does not exists', () => {
    var succ = walk.adjacentNode('1_INC', 'a', walk.successor, pGraph1())
    expect(succ).to.be.undefined
  })

  const incGraph = () => Graph.flow(
    Graph.addNode({name: 'const', ports: [{port: 'output', kind: 'output', type: 'a'}]}),
    Graph.addNode({name: 'add', ports: [{port: 's1', kind: 'input', type: 'a'}, {port: 's2', kind: 'input', type: 'a'}, {port: 'sum', kind: 'output', type: 'a'}]}),
    Graph.addEdge({from: 'const@output', to: 'add@s2'}),
    Graph.addEdge({from: 'add@sum', to: '@inc'}),
    Graph.addEdge({from: '@i', to: 'add@s1'})
  )(Graph.compound({name: 'inc', ports: [{port: 'i', kind: 'input', type: 'a'}, {port: 'inc', kind: 'output', type: 'a'}]}))

  /*
  var cmpGraph = Graph.empty()
    .addNode(incGraph)
    .addNode({id: 'stdout', ports: [{name: 'input', kind: 'input', type: 'a'}]})
    .addEdge({from: 'inc@inc', to: 'stdout@input'})
  */

  it('`adjacentNode` can handle compound nodes', () => {
    var preds = walk.adjacentNodes('»inc»add', 's1', walk.predecessor, incGraph())
    expect(preds).to.have.length(1)
    expect(noParent(preds[0])).to.deep.equal({node: 'inc', port: 'i', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
    var succs = walk.adjacentNodes(incGraph(), 'inc', 'i', walk.successor)
    expect(succs).to.have.length(1)
    expect(noParent(succs[0])).to.deep.equal({node: 'add', port: 's1', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
  })

  it('`adjacentNodes` can process multiple ports', () => {
    var preds = walk.adjacentNodes(incGraph(), 'add', ['s1', 's2'], walk.predecessor)
    expect(preds).to.have.length(2)
    expect(noParent(preds)).to.deep.include({node: 'const', port: 'output', edge: {from: 'const', outPort: 'output', to: 'add', inPort: 's2', layer: 'dataflow'}})
    expect(noParent(preds)).to.deep.include({node: 'inc', port: 'i', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
  })

  it('`adjacentNodes` removes not usable paths', () => {
    var preds = walk.adjacentNodes(incGraph(), 'add', ['s1', '-'], walk.predecessor)
    expect(preds).to.have.length(1)
    expect(noParent(preds[0])).to.deep.equal({node: 'inc', port: 'i', edge: {from: 'inc', outPort: 'i', to: 'add', inPort: 's1', innerCompoundOutput: true, layer: 'dataflow'}})
  })
})

describe.skip('Graph walks', () => {
  var pGraph1 = () => Convert.fromGraphlib(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph_simple.json'))))
  it('can walk forward through a given path', () => {
    var path = walk.walk(pGraph1(), '0_STDIN', ['output', 'inc'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('can walk backward through a given path', () => {
    var path = walk.walkBack(pGraph1(), '2_STDOUT', ['input', 'i'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  var pGraph2 = () => Convert.fromGraphlib(grlib.json.read(JSON.parse(fs.readFileSync('./test/fixtures/portgraph.json'))))
  it('can walk over a compound node', () => {
    var path = walk.walk(pGraph2(), '0_STDIN', ['output', 'inc'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('can walk into a compound node', () => {
    var path = walk.walk(pGraph2(), '0_STDIN', ['output', 'i'])
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '3_ADD'])
  })

  it('returns empty array if the path does not exist', () => {
    var path = walk.walk(pGraph2(), '0_STDIN', ['a'])
    expect(path).to.have.length(0)
  })

  it('can follow multiple paths', () => {
    var path = walk.walkBack(pGraph2(), '3_ADD', [['s1', 's2']])
    expect(path).to.have.length(2)
    expect(path[0][0]).to.be.oneOf(['1_INC', '4_CONST1'])
    expect(path[1][0]).to.be.oneOf(['1_INC', '4_CONST1'])
  })

  it('can follow a path given by a function', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('output')
    cb.onCall(1).returns('inc')
    cb.onCall(2).returns([])
    var path = walk.walk(pGraph1(), '0_STDIN', cb)
    expect(path).to.have.length(1)
    expect(path[0]).to.deep.equal(['0_STDIN', '1_INC', '2_STDOUT'])
  })

  it('returns an empty array if the path given by a function does not exist', () => {
    var cb = sinon.stub()
    cb.onCall(0).returns('a')
    var path = walk.walk(pGraph1(), '0_STDIN', cb)
    expect(path).to.have.length(0)
  })

  it('gives a valid node object to the path function', () => {
    walk.walk(pGraph1(), '0_STDIN', (graph, node) => {
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
    var path = walk.walkBack(pGraph2(), '3_ADD', cb)
    expect(path).to.have.length(2)
    expect(path[0][0]).to.be.oneOf(['1_INC', '4_CONST1'])
    expect(path[1][0]).to.be.oneOf(['1_INC', '4_CONST1'])
  })

  it('calls the walk callback with the graph, node and port', () => {
    var cb = sinon.stub()
    cb.calledWith(pGraph2(), '0_STDIN', 'output')
    walk.walkBack(pGraph2(), '1_INC', cb)
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

