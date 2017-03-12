/* eslint-env mocha */

import {expect} from 'chai'
import * as Graph from '../src/graph'

describe('Components', () => {
  describe('Manipulating components in graphs', () => {
    it('Should be possible to add a component', () => {
      var graph = Graph.addComponent({componentId: 'A', ports: [{port: 'X', kind: 'output', type: 'X'}], version: '0.0.0'}, Graph.empty())
      expect(Graph.components(graph)).to.have.length(1)
      expect(Graph.hasComponent('A', graph)).to.be.true
    })

    it('Components are queriable by componentId', () => {
      var graph = Graph.addComponent({componentId: 'A', ports: [{port: 'X', kind: 'output', type: 'X'}], version: '0.0.0'}, Graph.empty())
      expect(Graph.component('A', graph).componentId).to.equal('A')
    })

    it('Rejects adding invalid components', () => {
      expect(() => Graph.addComponent({componentId: 'A'}, Graph.empty())).to.throw(Error)
    })

    it('Can remove a component', () => {
      var graph = Graph.addComponent({componentId: 'A', ports: [{port: 'X', kind: 'output', type: 'X'}], version: '0.0.0'}, Graph.empty())
      var remGraph = Graph.removeComponent('A', graph)
      expect(Graph.components(graph)).to.have.length(1)
      expect(Graph.components(remGraph)).to.have.length(0)
      expect(Graph.hasComponent('A', remGraph)).to.be.false
    })

    it('Updates an existing component', () => {
      var graph = Graph.addComponent({componentId: 'A', ports: [{port: 'X', kind: 'output', type: 'X'}], version: '0.0.0'}, Graph.empty())
      var upGraph = Graph.updateComponent('A', {version: '0.1.0'}, graph)
      expect(Graph.hasComponent('A', upGraph)).to.be.true
      expect(Graph.component('A', upGraph).version).to.equal('0.1.0')
    })
  })
})
