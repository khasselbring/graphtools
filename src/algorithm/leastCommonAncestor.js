
import curry from 'lodash/fp/curry'
import * as Graph from '../graph'

export const leastCommonAncestor = curry((locations, graph) => {
  return Graph.node(locations[0], graph)
})
