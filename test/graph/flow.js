/* eslint-env mocha */

import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import * as Graph from '../../src/graph'

chai.use(sinonChai)
var expect = chai.expect
const Let = Graph.Let

describe('Basic graph functions', () => {
  describe('» .flow', () => {
    it('» Can work with named flows', () => {
      var graph = Graph.namedFlow(
        'Adding simple reference', Graph.addNode({ref: 'a'})
      )()
      expect(Graph.nodes(graph)).to.have.length(1)
    })

    it('» Throws errors containing the description', () => {
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

    it('» Can use let to get information out of operations', () => {
      var resSpy = sinon.spy((res) => expect(res).to.equal('let-value'))
      Graph.flow(
        Let((graph, cb) => cb('let-value'), resSpy)
      )()
      expect(resSpy).to.have.been.calledOnce
    })

    it('» Can use let to get information out of operations', () => {
      var resSpy = sinon.spy((res) => expect(res).to.eql(['let-value-1', 'let-value-2']))
      Graph.flow(
        Let([(graph, cb) => cb('let-value-1'), (graph, cb) => cb('let-value-2')], resSpy)
      )()
      expect(resSpy).to.have.been.calledOnce
    })

    it('» Allows passing options as the last parameter', () => {
      var flowFn = Graph.flow(
        () => { throw new Error('test error') },
        {
          name: 'flowFunction',
          names: ['Bad function']
        }
      )
      expect(flowFn).to.throw(Error, /flowFunction/)
      expect(flowFn).to.throw(Error, /Bad function/)
    })
  })
})
