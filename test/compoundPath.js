/* global describe, it */

import chai from 'chai'
import * as CompoundPath from '../src/compoundPath.js'
// import _ from 'lodash'

var expect = chai.expect

describe('Compound paths', () => {
  it('Can normalize paths correctly', () => {
    expect(CompoundPath.normalize('')).to.eql([])
    expect(CompoundPath.normalize([''])).to.eql([])
    expect(CompoundPath.normalize('»')).to.eql([])
    expect(CompoundPath.normalize('a')).to.eql(['a'])
    expect(CompoundPath.normalize(['a'])).to.eql(['a'])
    expect(CompoundPath.normalize('»a')).to.eql(['a'])
    expect(CompoundPath.normalize('»a»b')).to.eql(['a', 'b'])
    expect(CompoundPath.normalize(['a', 'b'])).to.eql(['a', 'b'])
  })
})
