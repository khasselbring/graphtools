/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../src/changeSet'
import {importJSON} from '../src/io'
import * as Graph from '../src/graph'
import _ from 'lodash'
import semver from 'semver'

var expect = chai.expect

describe('Basic graph functions', () => {
  it('can create an empty graph', () => {
    var graph = Graph.empty()
    expect(Graph.nodes(graph)).to.have.length(0)
    expect(Graph.edges(graph)).to.have.length(0)
    expect(Graph.components(graph)).to.have.length(0)
    expect(_.keys(Graph.meta(graph))).to.have.length(1)
    expect(Graph.meta(graph)).to.have.property('version')
    expect(semver.valid(Graph.meta(graph).version)).to.be.ok
  })

  it('fails if a non existend node is queried', () => {
    expect(() => Graph.node(Graph.empty(), 'a')).to.throw(Error)
  })

  it('get all nodes', () => {
    var graph = changeSet.applyChangeSets(Graph.empty(), [
      changeSet.insertNode({id: 'a'}),
      changeSet.insertNode({id: 'b'})
    ])
    expect(Graph.nodes(graph)).to.have.length(2)
  })

  it('does not include meta information', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.addMetaInformation('a', 'b'))
    expect(Graph.nodes(graph)).to.have.length(0)
  })

  it('returns a map of all meta information', () => {
    var graph = changeSet.applyChangeSet(Graph.empty(), changeSet.addMetaInformation('a', 'b'))
    var meta = Graph.meta(graph)
    expect(meta).to.be.an('object')
    expect(meta).to.have.property('a')
    expect(meta.a).to.equal('b')
  })
})
