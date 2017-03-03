/* eslint-env mocha */

import chai from 'chai'
import * as Graph from '../src/api'

var expect = chai.expect

describe('API', () => {
  it('» exports the API correctly', () => {
    expect(Graph).to.be.ok
    expect(Graph.Node).to.be.ok
    expect(Graph.Edge).to.be.ok
    expect(Graph.Port).to.be.ok
    expect(Graph.Rewrite).to.be.ok
    expect(Graph.Algorithm).to.be.ok
    expect(Graph.Component).to.be.ok
    expect(Graph.CompoundPath).to.be.ok
  })
})
