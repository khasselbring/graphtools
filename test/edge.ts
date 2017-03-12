/* global describe, it */

import {expect} from 'chai'
import * as Edge from '../src/edge'
import * as Port from '../src/port'

describe('Edge API', () => {
  it('Normalizes an edge correctly', () => {
    const normEdge = Edge.normalize({from: 'a@out', to: 'b@in'})
    expect(Port.isPort(normEdge.from)).to.be.true
    expect(Port.isPort(normEdge.to)).to.be.true
    expect(normEdge.layer).to.equal('dataflow')
  })

  it('can compare edges', () => {
    const edge1 = Edge.normalize({from: 'a@out', to: 'b@in'})
    const edge2 = Edge.normalize({from: {node: 'a', port: 'out'}, to: {node: 'b', port: 'in'}})
    const edge3 = Edge.normalize({from: 'a@out', to: 'c@in'})
    const edge4 = Edge.normalize({from: 'a@out2', to: 'b@in'})
    const edge5 = Edge.normalize({from: 'a@out', to: 'b@in2'})
    expect(Edge.equal(edge1, edge2)).to.be.true
    expect(Edge.equal(edge1, edge3)).to.be.false
    expect(Edge.equal(edge1, edge4)).to.be.false
    expect(Edge.equal(edge1, edge5)).to.be.false
  })

  it('can normalize a non dataflow edge', () => {
    const newEdge = Edge.normalize({from: {id: 'A', ports: [{port: 'a', kind: 'input', type: 'a'}]}, to: 'B', layer: 'other'})
    expect(newEdge.from).to.equal('A')
    const newEdge2 = Edge.normalize({from: 'A', to: {id: 'B', ports: [{port: 'a', kind: 'input', type: 'a'}]}, layer: 'other'})
    expect(newEdge2.to).to.equal('B')
  })
})
