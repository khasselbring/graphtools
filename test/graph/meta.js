/* eslint-env mocha */

import chai from 'chai'
import * as changeSet from '../../src/changeSet'
import * as Graph from '../../src/graph'
import * as Node from '../../src/node'
import {port} from '../../src/port'
import _ from 'lodash'
import semver from 'semver'

var expect = chai.expect

const toNames = (graph) => (id) => Node.name(Graph.node(id, graph))

describe('Basic graph functions', () => {
  describe('Meta information', () => {
    it('returns a map of all meta information', () => {
      var graph = Graph.setMetaKey('a', 'b', Graph.empty())
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal('b')
    })

    it('sets a whole object as meta', () => {
      var graph = Graph.setMeta({a: 'b'}, Graph.empty())
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal('b')
    })

    it('import from JSON', () => {
      var graphJSON = {
        nodes:[],
        edges:[],
        metaInformation: {a: 'test'}
      }
      var graph = Graph.fromJSON(graphJSON)
      expect(graph).to.be.ok
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal(graphJSON.metaInformation.a)
    })
  })
})
