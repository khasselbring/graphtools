/* global describe, it */

import chai from 'chai'
import * as Lambda from '../src/functional/lambda'

var expect = chai.expect

describe('Functional API', () => {
  it('creates a valid lambda node', () => {
    var lambda = Lambda.createLambda({ref: 'X'})
    expect(Lambda.isValid(lambda)).to.be.true
  })
})
