/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../../src/graph'

var expect = chai.expect

describe('Basic graph functions', () => {
  describe('flow', () => {
    it('Can work with named flows', () => {
      var graph = Graph.namedFlow(
        'Adding simple reference', Graph.addNode({ref: 'a'})
      )()
      expect(Graph.nodes(graph)).to.have.length(1)
    })

    it('Throws errors containing the description', () => {
      var errFn = Graph.namedFlow(
        'Breaking stuff', (graph) => { throw Error('Forced Error') }
      )
      expect(errFn).to.throw(Error)
      try {
        errFn()
      } catch (err) {
        expect(err.stack).to.contain('Breaking stuff')
      }
    })
  })
})
