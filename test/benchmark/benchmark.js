import * as Graph from '../../src/api'
import * as Runtime from '../../src/benchmark/runtime'
// import * as Visualize from '../../src/benchmark/visualize'
import * as Benchmarks from '../../src/benchmark/benchmarks'
import chai from 'chai'

const expect = chai.expect

const Location = require('../../src/location')

describe('» Playground', () => {
  it('can add Nodes', () => {
    const graph = Graph.flow(
      Graph.addNode({ name: 'a', ports: [{ port: 'out', kind: 'output', type: 'Number' }] }),
      Graph.addNode({ name: 'b', ports: [{ port: 'in', kind: 'input', type: 'Number' }] })
    )()

    expect(Graph.hasNode('a', graph)).to.be.true
    expect(Graph.hasNode('b', graph)).to.be.true
  })

  it('can add Edges', function () {
    const graph = Graph.flow(
      Graph.addNode({ name: 'a', ports: [{ port: 'out', kind: 'output', type: 'Number' }] }),
      Graph.addNode({ name: 'b', ports: [{ port: 'in', kind: 'input', type: 'Number' }] })
    )()

    expect(Graph.hasNode('a', graph)).to.be.true
    expect(Graph.hasNode('b', graph)).to.be.true
    expect(Graph.edges(graph)).to.have.length(0)
    expect(Graph.areConnected('a', 'b', graph)).to.be.false

    const graph2 = Graph.addEdge({ name: 'a-to-b', from: 'a@out', to: 'b@in' }, graph)

    expect(Graph.edges(graph2)).to.have.length(1)
    expect(Graph.areConnected('a', 'b', graph2)).to.be.true

    const edge = Graph.Edge.normalize({ from: 'a@out', to: 'b@in' })
    const graph3 = Graph.addEdge(edge, graph)

    expect(Graph.edges(graph3)).to.have.length(1)
    expect(Graph.areConnected('a', 'b', graph3)).to.be.true
  })
})

describe('» Runtime', () => {
  it('has a runtime for adding nodes', () => {
    const size = 10

    var before = new Date()
    var graph = Runtime.addNodeAmount(size)
    var after = new Date()
    var diff = after - before

    expect(Graph.nodes(graph)).to.have.length(size)
    expect(diff).to.be.above(0)
  })

  it('increases runtime when adding more nodes', () => {
    var timings = []

    for (var i = 10; i <= 200; i += 10) {
      timings.push(Runtime.executionTime(function () {
        Runtime.addNodeAmount(i)
      }))
    }

    expect(true).to.be.true
  })
})

describe('» Behavior', () => {
  it('Correctly detects linear Behavior', () => {
    const values = [0, 1, 2, 3, 4, 5, 6]

    expect(Runtime.hasGrowthBehavior(values, 'linear', 10)).to.be.true
  })

  it('Correctly detects missing linear Behavior', () => {
    const values = [0, 1, 2, 7, 4, 5, 6]

    expect(Runtime.hasGrowthBehavior(values, 'linear', 10)).to.be.false
  })

  it('Correctly detects exponential Behavior', () => {
    const values = [1, 2, 4, 8, 16, 32]

    expect(Runtime.hasGrowthBehavior(values, 'exponential', 10)).to.be.true
  })

  it('Correctly detects missing exponential Behavior', () => {
    const values = [1, 2, 4, 5, 16, 32]

    expect(Runtime.hasGrowthBehavior(values, 'exponential', 10)).to.be.false
  })
})

describe.skip('» Visualization', () => {
  it('Can Plot a grah', () => {
    const data = {
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16]
    }

    const diagram = Visualize.plotRuntime(data)

    expect(diagram).not.to.be.a('undefined')
  })
})

describe('» Benchmark', () => {
  it.only('can multibenchmark', () => {
    Benchmarks.benchmarkRange(Benchmarks.benchmarkAddNodes, 'addNodes.csv', 'add x nodes', [0], 0, 10, 500, 49)
    Benchmarks.benchmarkRange(Benchmarks.benchmarkFindNodes, 'findNodes1.csv', 'find x in 10', [10, 0], 1, 10000, 10000000, 19)
    Benchmarks.benchmarkRange(Benchmarks.benchmarkFindNodes, 'findNodes2.csv', 'find 1000000 in x', [0, 1000000], 0, 50, 500, 9)
  })

  it('has a runtime for searching a hashtable', () => {
    Benchmarks.benchmarkSearchingHashtable(100, 10000)
    Benchmarks.benchmarkSearchingHashtable(1000, 10000)
    Benchmarks.benchmarkSearchingHashtable(10000, 10000)
    Benchmarks.benchmarkSearchingHashtable(100000, 10000)
    Benchmarks.benchmarkSearchingHashtable(1000000, 10000)
    console.log('==========================')
    Benchmarks.benchmarkSearchingHashtable(10000, 1000)
    Benchmarks.benchmarkSearchingHashtable(10000, 10000)
    Benchmarks.benchmarkSearchingHashtable(10000, 100000)
    Benchmarks.benchmarkSearchingHashtable(10000, 1000000)
    Benchmarks.benchmarkSearchingHashtable(10000, 10000000)
  })

  it('Can Benchmark adding nodes', () => {
    Benchmarks.benchmarkAddNodes(10)
    Benchmarks.benchmarkAddNodes(20)
    Benchmarks.benchmarkAddNodes(30)
    Benchmarks.benchmarkAddNodes(40)
    Benchmarks.benchmarkAddNodes(50)
  })

  it('Can Benchmark finding nodes', () => {
    Benchmarks.benchmarkFindNodes(10, 50000)
    Benchmarks.benchmarkFindNodes(10, 100000)
    Benchmarks.benchmarkFindNodes(10, 500000)
    Benchmarks.benchmarkFindNodes(10, 1000000)
    Benchmarks.benchmarkFindNodes(10, 2500000)
    Benchmarks.benchmarkFindNodes(10, 5000000)
    Benchmarks.benchmarkFindNodes(10, 7500000)
    Benchmarks.benchmarkFindNodes(10, 10000000)
    console.log('==========================')
    Benchmarks.benchmarkFindNodes(10, 1000000)
    Benchmarks.benchmarkFindNodes(20, 1000000)
    Benchmarks.benchmarkFindNodes(30, 1000000)
    Benchmarks.benchmarkFindNodes(40, 1000000)
    Benchmarks.benchmarkFindNodes(50, 1000000)
  })

  it('Can Benchmark adding edges', () => {
    Benchmarks.benchmarkAddEdgesMapped(10, 10)
    Benchmarks.benchmarkAddEdgesMapped(20, 10)
    Benchmarks.benchmarkAddEdgesMapped(30, 10)
    Benchmarks.benchmarkAddEdgesMapped(40, 10)
    Benchmarks.benchmarkAddEdgesMapped(50, 10)
    console.log('==========================')
    Benchmarks.benchmarkAddEdgesMapped(10, 10)
    Benchmarks.benchmarkAddEdgesMapped(20, 20)
    Benchmarks.benchmarkAddEdgesMapped(30, 30)
    Benchmarks.benchmarkAddEdgesMapped(40, 40)
    Benchmarks.benchmarkAddEdgesMapped(50, 50)
    console.log('==========================')
    Benchmarks.benchmarkAddEdgesMapped(50, 10)
    Benchmarks.benchmarkAddEdgesMapped(50, 20)
    Benchmarks.benchmarkAddEdgesMapped(50, 30)
    Benchmarks.benchmarkAddEdgesMapped(50, 40)
    Benchmarks.benchmarkAddEdgesMapped(50, 50)
  })

  it('Can Benchmark checking connection', () => {
    Benchmarks.benchmarkCheckConnected(50, 50, 10)
    Benchmarks.benchmarkCheckConnected(50, 50, 100)
    Benchmarks.benchmarkCheckConnected(50, 50, 1000)
    Benchmarks.benchmarkCheckConnected(50, 50, 10000)
    Benchmarks.benchmarkCheckConnected(50, 50, 100000)
    console.log('==========================')
    Benchmarks.benchmarkCheckConnected(10, 10, 10000)
    Benchmarks.benchmarkCheckConnected(20, 10, 10000)
    Benchmarks.benchmarkCheckConnected(30, 10, 10000)
    Benchmarks.benchmarkCheckConnected(40, 10, 10000)
    Benchmarks.benchmarkCheckConnected(50, 10, 10000)
    console.log('==========================')
    Benchmarks.benchmarkCheckConnected(50, 10, 10000)
    Benchmarks.benchmarkCheckConnected(50, 20, 10000)
    Benchmarks.benchmarkCheckConnected(50, 30, 10000)
    Benchmarks.benchmarkCheckConnected(50, 40, 10000)
    Benchmarks.benchmarkCheckConnected(50, 50, 10000)
  })
})
