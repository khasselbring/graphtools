/* eslint-env mocha */

import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import * as Graph from '../../src/graph'
import * as Node from '../../src/node'

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

  describe('» .sequential', () => {
    it('» feeds outputs to the next sequence function', () => {
      Graph.sequential([
        (graph, cb) => cb(1, graph),
        (data, graph) => {
          expect(data, 'Feeding data using a simple callback').to.equal(1)
          return graph
        }
      ])(Graph.empty())

      Graph.sequential([
        Graph.addNode({name: 'a', ports: [{port: 'a', kind: 'output', type: 'generic'}]}),
        (data, graph) => {
          expect(Node.name(data), 'Works with existing API methods').to.equal('a')
          return graph
        }
      ])(Graph.empty())
    })

    it('» Complains if not all elements in the array are functions', () => {
      expect(() => Graph.sequential([(a, cb) => cb('data', a), (c, a, cb) => cb(a), 1])(1)).to.throw(Error, /Argument in sequence at position 3 is not a callable/)
    })

    it('» Complains if the callback function in one sequence function is not called', () => {
      expect(() => Graph.sequential([(a, cb) => a, (c, a, cb) => cb(a)])(1)).to.throw(Error, /Callback function not called in sequence function at position 1/)
    })

    it('» Calls the last callback', () => {
      var resSpy = sinon.spy()
      Graph.sequential([
        (graph, cb) => cb(1, graph),
        (data, graph, cb) => {
          resSpy()
          return cb(data, graph)
        }
      ])(Graph.empty(), resSpy)
      expect(resSpy).to.have.been.calledTwice
    })
  })

  describe('» .distribute', () => {
    it('» complains if not all functions for distribute are curried', () => {
      expect(() => Graph.distribute([(a, graph) => graph])(Graph.empty())).to.throw(Error, /Function 1 in distribute is not curried./)
    })
  })
})
