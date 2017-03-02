/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../../src/graph'
import * as Algorithms from '../../src/algorithm/algorithms'
import * as Node from '../../src/node'

const expect = chai.expect

describe('Graph Algorithms', () => {
  describe('» Lowest common ancestor', () => {
    it('» Works if LCA is predecessor.', () => {
      const graph = Graph.flow(
        Graph.addNode({name: 'a', ports: [{port: 'out', kind: 'output', type: 'g'}]}),
        Graph.addNode({name: 'b', ports: [{port: 'in1', kind: 'input', type: 'g'}, {port: 'in2', kind: 'input', type: 'g'}]}),
        Graph.addEdge({from: 'a@out', to: 'b@in1'}),
        Graph.addEdge({from: 'a@out', to: 'b@in2'})
      )()
      expect(Algorithms.lowestCommonAncestors(['b@in1', 'b@in2'], graph).map(Node.name)).to.eql(['a'])
    })
  })
})
