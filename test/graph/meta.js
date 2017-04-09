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

    it('removes meta keys', () => {
      const graph = Graph.setMeta({a: 'b'}, Graph.empty())
      expect(Graph.getMetaKey('a', graph)).to.be.ok
      const rGraph = Graph.removeMetaKey('a', graph)
      expect(Graph.getMetaKey('a', rGraph)).to.be.undefined
    })

    it('import from JSON', () => {
      var graphJSON = {
        id: '#id',
        nodes: [],
        edges: [],
        metaInformation: {a: 'test'}
      }
      var graph = Graph.fromJSON(graphJSON)
      expect(graph).to.be.ok
      var meta = Graph.meta(graph)
      expect(meta).to.be.an('object')
      expect(meta).to.have.property('a')
      expect(meta.a).to.equal(graphJSON.metaInformation.a)
    })

    it('it is possible to set meta information for a node', () => {
      const graph = Graph.addNode({name: 'a', ports: [{port: 'a', kind: 'output', type: 'a'}]}, Graph.empty())
      const mGraph = Graph.setNodeMetaKey('meta', 'value', 'a', graph)
      expect(Graph.getNodeMetaKey('meta', 'a', mGraph)).to.equal('value')
      const mGraph2 = Graph.setNodeMetaKey('parameters.typings', {X: true}, 'a', graph)
      expect(Graph.getNodeMetaKey('parameters.typings', 'a', mGraph2)).to.eql({X: true})
    })

    it('setting meta information overwrites existing meta information', () => {
      const graph = Graph.addNode({name: 'a', ports: [{port: 'a', kind: 'output', type: 'a'}]}, Graph.empty())
      const mGraph1 = Graph.setNodeMetaKey('parameters.typings', {X: true}, 'a', graph)
      expect(Graph.getNodeMetaKey('parameters.typings', 'a', mGraph1)).to.eql({X: true})
      const mGraph2 = Graph.setNodeMetaKey('parameters.typings', {Y: false}, 'a', mGraph1)
      expect(Graph.getNodeMetaKey('parameters.typings', 'a', mGraph2)).to.eql({Y: false})
    })

    it('updating node meta information extends existing meta information', () => {
      const graph = Graph.addNode({name: 'a', ports: [{port: 'a', kind: 'output', type: 'a'}]}, Graph.empty())
      const mGraph1 = Graph.setNodeMetaKey('parameters.typings', {X: true}, 'a', graph)
      expect(Graph.getNodeMetaKey('parameters.typings', 'a', mGraph1)).to.eql({X: true})
      const mGraph2 = Graph.updateNodeMetaKey('parameters.typings', {Y: false}, 'a', mGraph1)
      expect(Graph.getNodeMetaKey('parameters.typings', 'a', mGraph2)).to.eql({Y: false, X: true})
    })

    it('removes meta keys from nodes', () => {
      const graph = Graph.addNode({name: 'a', ports: [{port: 'a', kind: 'output', type: 'a'}]}, Graph.empty())
      const mGraph1 = Graph.setNodeMetaKey('parameters.typings', {X: true}, 'a', graph)
      expect(Graph.getNodeMetaKey('parameters.typings', 'a', mGraph1)).to.eql({X: true})
      const mGraph2 = Graph.removeNodeMetaKey('parameters.typings', 'a', mGraph1)
      expect(Graph.getNodeMetaKey('parameters.typings', 'a', mGraph2)).to.be.undefined
    })

    it('can set all meta information for a node', () => {
      const graph = Graph.addNode({name: 'a', ports: [{port: 'a', kind: 'output', type: 'a'}]}, Graph.empty())
      const mGraph1 = Graph.setNodeMeta({X: true}, 'a', graph)
      expect(Graph.getNodeMetaKey('X', 'a', mGraph1)).to.be.true
    })

    it('interprets dot-notation as object paths', () => {
      var graph = Graph.setMeta({a: {b: 'c'}}, Graph.empty())
      expect(Graph.getMetaKey('a.b', graph)).to.equal('c')
      var graph2 = Graph.setMetaKey('d.e', 4, graph)
      expect(Graph.getMetaKey('d', graph2)).to.be.an('object')
    })
  })
})
