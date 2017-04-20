/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../../src/graph'
import * as Node from '../../src/node'
import fs from 'fs'

var expect = chai.expect

describe('Basic graph functions', () => {
  describe('Connection functions', () => {
    describe('.predecessors', () => {
      it('Can find the predecessor of a recursion node', () => {
        const graph = Graph.fromJSON(JSON.parse(fs.readFileSync('test/fixtures/fac.json', 'utf8')))
        const facNode = Graph.nodesDeepBy((n) => Node.get('isRecursive', n) && !Node.get('recursiveRoot', n), graph)[0]
        const pred = Graph.predecessor(Node.port('n', facNode), graph)
        const pred2 = Graph.predecessor(facNode, graph)
        expect(Graph.node(pred, graph).componentId).to.equal('math/add')
        expect(Graph.node(pred2, graph).componentId).to.equal('math/add')
      })
    })

    describe('.successors', () => {
      it('Can find the successors of a recursion node', () => {
        const graph = Graph.fromJSON(JSON.parse(fs.readFileSync('test/fixtures/fac.json', 'utf8')))
        const facNode = Graph.nodesDeepBy((n) => Node.get('isRecursive', n) && !Node.get('recursiveRoot', n), graph)[0]
        const pred = Graph.successors(Node.port('value', facNode), graph)[0]
        const pred2 = Graph.successors(facNode, graph)[0]
        expect(Graph.node(pred, graph).componentId).to.equal('math/multiply')
        expect(Graph.node(pred2, graph).componentId).to.equal('math/multiply')
      })
    })

    describe('.areConnected', () => {
      it('finds connected nodes', () => {
        const graph = Graph.fromFile('test/fixtures/fac.json', 'utf8')
        expect(Graph.areConnected('/numToStr', '/print', graph)).to.be.true
      })
    })
  })
})
