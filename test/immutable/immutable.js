import chai from 'chai'

const expect = chai.expect

describe.only('» Immutable', () => {
  it('can work with compound graphs', () => {
    const { fromJS } = require('immutable')

    const nodeA = {
      id: '#A',
      value: 1
    }

    const nodeB = {
      id: '#B',
      value: 2
    }

    const nodeC = {
      id: '#C',
      value: 3
    }

    const compound = {
      id: '#Comp',
      value: 4,
      nodes: [nodeB],
      compounds: [],
      __internal__: {
        idHashMap: {
          '#B': nodeB
        }
      }
    }

    const graph = {
      id: '#G',
      value: 0,
      nodes: [nodeA],
      compounds: [compound],
      __internal__: {
        idHashMap: {
          '#A': nodeA,
          '#B': nodeB
        }
      }
    }

    const immutableMap = fromJS(graph)

    const immutableMap2 = immutableMap.update('compounds', compounds => compounds.update(0, compound => compound.update('nodes', nodes => nodes.push(nodeC))))
    const immutableMap3 = immutableMap2.update('compounds', compounds => compounds.update(0, compound => compound.update('__internal__', __internal__ => __internal__.update('idHashMap', idHashMap => idHashMap.set('#C', nodeC)))))
    const immutableMap4 = immutableMap3.update('__internal__', __internal__ => __internal__.update('idHashMap', idHashMap => idHashMap.set('#C', nodeC)))

    const graphAfter = immutableMap4.toJS()

    const expectedCompound = {
      id: '#Comp',
      value: 4,
      nodes: [nodeB, nodeC],
      compounds: [],
      __internal__: {
        idHashMap: {
          '#B': nodeB,
          '#C': nodeC
        }
      }
    }

    const expected = {
      id: '#G',
      value: 0,
      nodes: [nodeA],
      compounds: [expectedCompound],
      __internal__: {
        idHashMap: {
          '#A': nodeA,
          '#B': nodeB,
          '#C': nodeC
        }
      }
    }
    expect(graphAfter).to.deep.equal(expected)
  })
})
