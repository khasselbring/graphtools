/* global describe, it */

import chai from 'chai'
import * as Node from '../src/node.js'
// import _ from 'lodash'

var expect = chai.expect

describe('Node API', () => {
  it('Gets the id of a node', () => {
    expect(Node.id('a')).to.equal('a')
    expect(Node.id({id: 'b'})).to.equal('b')
  })

  it('throws an error if the id is not defined correctly', () => {
    expect(() => Node.id()).to.throw(Error)
    expect(() => Node.id({ID: 'a'})).to.throw(Error)
  })

  it('can compare nodes by id', () => {
    expect(Node.equal('a', 'a')).to.be.true
    expect(Node.equal('b', 'a')).to.be.false
    expect(Node.equal({id: 'a'}, 'a')).to.be.true
    expect(Node.equal({id: 'a'}, 'b')).to.be.false
    expect(Node.equal('a', {id: 'a'})).to.be.true
    expect(Node.equal('b', {id: 'a'})).to.be.false
    expect(Node.equal({id: 'a'}, {id: 'a'})).to.be.true
    expect(Node.equal({id: 'b'}, {id: 'a'})).to.be.false
  })

  it('throws an error if the arguments to ID are incorrect', () => {
    expect(() => Node.equal('a')).to.throw(Error)
    expect(() => Node.equal(null, 'b')).to.throw(Error)
    expect(() => Node.equal('a', {ID: 'b'})).to.throw(Error)
    expect(() => Node.equal({idd: 'a'}, {ID: 'b'})).to.throw(Error)
    expect(() => Node.equal({idd: 'a'}, 'b')).to.throw(Error)
  })

  it('can check the validity of a node', () => {
    expect(Node.isValid({id: 'a', ports: [{name: 'p'}]})).to.be.true
    expect(Node.isValid({id: 'a', ports: [{name: 'p'}], prop: 'p'})).to.be.true
    expect(Node.isValid({id: 'a'})).to.be.false
    expect(Node.isValid({idd: 'a', ports: [{name: 'p'}]})).to.be.false
    expect(Node.isValid({})).to.be.false
    expect(Node.isValid({ports: [{name: 'p'}]})).to.be.false
    expect(Node.isValid()).to.be.false
  })

  it('can get different port types', () => {
    expect(Node.ports({ports: [{name: 'a', type: 'outputPort'}]})).to.have.length(1)
    expect(Node.outputPorts({ports: [{name: 'a', type: 'outputPort'}]})).to.have.length(1)
    expect(Node.outputPorts({ports: [{name: 'a', type: 'inputPort'}]})).to.have.length(0)
    expect(Node.outputPorts({ports: [
      {name: 'a', type: 'outputPort'},
      {name: 'b', type: 'inputPort'},
      {name: 'c', type: 'outputPort'}
    ]})).to.have.length(2)
    expect(Node.inputPorts({ports: [{name: 'a', type: 'outputPort'}]})).to.have.length(0)
    expect(Node.inputPorts({ports: [{name: 'a', type: 'inputPort'}]})).to.have.length(1)
    expect(Node.inputPorts({ports: [
      {name: 'a', type: 'outputPort'},
      {name: 'b', type: 'inputPort'},
      {name: 'c', type: 'inputPort'}
    ]})).to.have.length(2)
  })

  it('can check if a node has a port', () => {
    expect(Node.hasPort({ports: [{name: 'a'}]}, 'a')).to.be.true
    expect(Node.hasPort({ports: [{name: 'b'}]}, 'a')).to.be.false
    expect(Node.hasPort({}, 'a')).to.be.false
    expect(Node.hasPort({})).to.be.false
  })
})
