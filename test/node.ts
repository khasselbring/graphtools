/* global describe, it */

import {expect} from 'chai'
import * as Node from '../src/node'
import {Port} from '../src/port'
// import _ from 'lodash'

const dPort:Port = {port: 'a', kind: 'input'}

describe('Node API', () => {
  it('`Node.create` creates nodes correctly', () => {
    expect(Node.create({ports: [{port: 'a', kind: 'output'}]})).to.be.ok
    expect(Node.create({ports: [{port: 'a', kind: 'output'}]}).id).to.be.ok
    expect(Node.create({name: 'b', ports: [{port: 'a', kind: 'output'}]})).to.be.ok
    expect(Node.create({name: 'b', ports: [{port: 'a', kind: 'output'}]}).id).to.be.ok
  })

  it('`Node.create` does not create invalid nodes and throws an error', () => {
    expect(() => Node.create({id: 'a', name: 'b', ports: [{port: 'a', kind: 'output'}]})).to.throw(Error)
  })

  it('`Node.id` works for nodes and strings', () => {
    expect(Node.id('a')).to.equal('a')
  })

  it('`Node.name` gets the name of a node', () => {
    expect(Node.name({name: 'a', ref: 'r'})).to.equal('a')
    expect(Node.name({id: 'b', ref: 'r'})).to.equal('b')
    expect(Node.name({name: 'a', id: 'b', ports: [{port: 'a', kind: 'input'}]})).to.equal('a')
  })

  it('`Node.equal` can compare nodes by id', () => {
    expect(Node.equal('a', 'a')).to.be.true
    expect(Node.equal('b', 'a')).to.be.false
    expect(Node.equal({id: 'a', ports: [dPort]}, 'a')).to.be.true
    expect(Node.equal({id: 'a', ports: [dPort]}, 'b')).to.be.false
    expect(Node.equal('a', {id: 'a', ports: [dPort]})).to.be.true
    expect(Node.equal('b', {id: 'a', ports: [dPort]})).to.be.false
    expect(Node.equal({id: 'a', ports: [dPort]}, {id: 'a', ports: [dPort]})).to.be.true
    expect(Node.equal({id: 'b', ports: [dPort]}, {id: 'a', ports: [dPort]})).to.be.false
  })

  it('`Node.equal` throws an error if the arguments to ID are incorrect', () => {
    expect(() => Node.equal(null, 'b')).to.throw(Error)
  })

  it('`isValid` can check the validity of a node', () => {
    expect(Node.isValid({id: 'a', ports: [{port: 'p', kind: 'output', type: 'number'}]})).to.be.true
    expect(Node.isValid({id: 'a', ports: [{port: 'p'}]})).to.be.false
    expect(Node.isValid({id: 'a', ports: [{port: 'p', kind: 'nop', type: 'A'}]})).to.be.false
    expect(Node.isValid({id: 'a', ports: [{port: 'p', type: 'A'}]})).to.be.false
    expect(Node.isValid({id: 'a', ports: [{port: 'p', kind: 'output'}]})).to.be.false
    expect(Node.isValid({ports: [{port: 'p', kind: 'output', type: 'number'}]})).to.be.false
  })

  it('`ports` always return the correct node id', () => {
    expect(Node.ports({ports: [{port: 'a', kind: 'output', type: 'g', node: '#aaaaa'}], id: '#123'})[0].node).to.equal('#123')
  })

  it('can get different port types', () => {
    expect(Node.ports({ports: [{port: 'a', kind: 'output'}], atomic: true})).to.have.length(1)
    expect(Node.outputPorts({ports: [{port: 'a', kind: 'output', type: 'number'}], atomic: true})).to.have.length(1)
    expect(Node.outputPorts({ports: [{port: 'a', kind: 'input'}], atomic: true})).to.have.length(0)
    expect(Node.outputPorts({ports: [
      {port: 'a', kind: 'output'},
      {port: 'b', kind: 'input'},
      {port: 'c', kind: 'output'}
    ], atomic: true})).to.have.length(2)
    expect(Node.inputPorts({ports: [{port: 'a', kind: 'output'}], atomic: true})).to.have.length(0)
    expect(Node.inputPorts({ports: [{port: 'a', kind: 'input'}], atomic: true})).to.have.length(1)
    expect(Node.inputPorts({ports: [
      {port: 'a', kind: 'output'},
      {port: 'b', kind: 'input'},
      {port: 'c', kind: 'input'}
    ], atomic: true})).to.have.length(2)
  })

  it('`hasPort` can check if a node has a port', () => {
    expect(Node.hasPort('a', {ports: [{port: 'a'}]})).to.be.true
    expect(Node.hasPort({port: 'a', node: ''}, {ports: [{port: 'a'}]})).to.be.true
    expect(Node.hasPort('a', {ports: [{port: 'b'}]})).to.be.false
    expect(Node.hasPort({port: 'a', node: ''}, {ports: [{port: 'b'}]})).to.be.false
  })

  it('`component` gets the referenced component in references', () => {
    expect(Node.component({ref: 'ABC'})).to.equal('ABC')
    expect(Node.component({ref: 'ABC', componentId: 'blubb'})).to.equal('ABC')
  })

  it('`component` gets the component of a standard node', () => {
    expect(Node.component({componentId: 'ABC', ports: [{port: 'a'}]})).to.equal('ABC')
  })
})
