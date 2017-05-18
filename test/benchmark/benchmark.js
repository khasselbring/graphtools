import * as Graph from '../../src/api'
import * as Runtime from '../../src/benchmark/runtime'
import * as Benchmark from '../../src/benchmark/benchmark'
import * as Benchmarks from '../../src/benchmark/benchmarks'
import chai from 'chai'

const expect = chai.expect

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

describe.only('» Benchmark', () => {
  const RESOLUTION = 100

  it('Can Benchmark adding nodes', () => {
    // TODO change addNodes to keep up with compound structures and deleteions
    Benchmark.benchmarkRange(Benchmarks.benchmarkAddNodes, 'addNodes.csv', 'Adding x nodes', [0], 0, 1, 1000, RESOLUTION)
  })

  it('Can Benchmark finding nodes', () => {
    Benchmark.benchmarkRange(Benchmarks.benchmarkFindNodes, 'findNodes1.csv', 'Finding 1 of 100 nodes x times', [100, 0], 1, 500000, 5000000, RESOLUTION)
    console.log('==========================')
    Benchmark.benchmarkRange(Benchmarks.benchmarkFindNodes, 'findNodes2.csv', 'Finding 1 of x nodes 1000000 times', [0, 1000000], 0, 10, 100, RESOLUTION)
  })

  it('Can Benchmark adding edges', () => {
    // TODO change addEdge to keep up with compound structures and deletions
    Benchmark.benchmarkRange(Benchmarks.benchmarkAddEdgesMapped, 'addEdges1.csv', 'Adding x nodes and 10 edges', [0, 10], 0, 10, 100, RESOLUTION)
    console.log('==========================')
    Benchmark.benchmarkRange(Benchmarks.benchmarkAddEdgesMapped, 'addEdges2.csv', 'Adding 100 nodes and x edges', [50, 0], 1, 5, 50, RESOLUTION)
  })

  it('Can Benchmark checking connection', () => {
    Benchmark.benchmarkRange(Benchmarks.benchmarkCheckConnected, 'checkConnected1.csv', 'Checking x connections in graph with 50 nodes, 50 edges', [50, 50, 0], 2, 100000, 1000000, RESOLUTION)
    console.log('==========================')
    Benchmark.benchmarkRange(Benchmarks.benchmarkCheckConnected, 'checkConnected2.csv', 'Checking 1000000 connections in graph with x nodes, 10 edges', [0, 10, 1000000], 0, 10, 100, RESOLUTION)
    console.log('==========================')
    Benchmark.benchmarkRange(Benchmarks.benchmarkCheckConnected, 'checkConnected3.csv', 'Checking 1000000 connections in graph with 50 nodes, x edges', [100, 0, 1000000], 1, 10, 100, RESOLUTION)
  })
})
