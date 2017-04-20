
import * as Graph from '../graph'
import * as Path from '../compoundPath'
import * as Node from '../node'

/**
 * Checks whether the locations have the same parent.
 * @param {Array<Location>} locations An array of locations to check
 * @param {Portgraph} graph The graph
 * @returns {Boolean} True if they have the same parents, false otherwise.
 */
function sameParentsNodes (nodes) {
  const compParent = Path.parent(Node.path(nodes[0]))
  return nodes.every((n) => Path.equal(Path.parent(Node.path(n)), compParent))
}

/**
 * Checks whether the locations have the same parent.
 * @param {Array<Location>} locations An array of locations to check
 * @param {Portgraph} graph The graph
 * @returns {Boolean} True if they have the same parents, false otherwise.
 */
export function sameParents (locations, graph) {
  return sameParentsNodes(locations.map((l) => Graph.node(l, graph)))
}

/**
 * Checks whether the locations are all children of the given parent.
 * @param {Location} parent The parent of the locations.
 * @param {Array<Location>} locations An array of locations to check
 * @param {Portgraph} graph The graph
 * @returns {Boolean} True if they have the same parents, false otherwise.
 */
export function childrenOf (parent, locations, graph) {
  if (locations.length === 0) return true
  return Path.equal(Node.path(Graph.parent(locations[0], graph)), Node.path(Graph.node(parent, graph))) &&
    sameParentsNodes(locations.map((l) => Graph.node(l, graph)))
}
