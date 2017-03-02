
import curry from 'lodash/fp/curry'
import flatten from 'lodash/fp/flatten'
import * as Graph from '../graph'
import {intersection, difference} from 'set-ops'
import * as Node from '../node'
import {isInnerEdge} from '../edge'

function ancestorsArray (locs, graph) {
  if (locs.length === 0) return []
  const preds = flatten(locs.map((l) => Graph.predecessors(l, graph))).map((n) => Node.id(Graph.node(n, graph)))
  return preds.concat(ancestorsArray(preds, graph))
}

function ancestors (location, graph) {
  if (!Array.isArray(location)) {
    return new Set(ancestorsArray([location], graph))
  }
  return new Set(ancestorsArray(location, graph))
}

function hasOnlyOutEdgesToParent (graph) {
  return (node) => Graph.outIncidents(node, graph).filter(isInnerEdge).length === 0
}

export const lowestCommonAncestors = curry((locations, graph) => {
  if (!Array.isArray(locations) || locations.length < 2) {
    throw new Error('Calculation of lowest common ancestor requires at least 2 nodes.')
  }
  if (!Graph.sameParents(locations, graph)) {
    throw new Error('The lowest common ancestor can only be calculated for nodes with equal parents.')
  }
  // according to Bender et al. 2005 the lowest common ancestors of a graph are the common ancestors
  // of out-degree zero in the subgraph of the graph induced by the set of common ancestors.
  // We only look for the nodes inside the compound and not the whole graph.
  const locationAncestors = locations.map((l) => ancestors(l, graph))
  const allNodes = new Set(Graph.nodes(Graph.parent(locations[0], graph)).map(Node.id))
  const commonAncestors = locationAncestors.reduce(intersection, allNodes)
  const nonCommon = difference(allNodes, commonAncestors)
  const commonGraph = Graph.flow([...nonCommon].map((n) => Graph.removeNode(n)))(graph)
  return Graph.nodes(commonGraph).filter(hasOnlyOutEdgesToParent(commonGraph))
})
