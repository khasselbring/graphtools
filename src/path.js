/** Not implemented yet.. */
/** @module path */

// import _ from 'lodash'
// import Node from './node'
// import Graph from './graph'

// /**
//  * A path containing a succession of nodes connected via edges. If the path is given as an array of objects,
//  * each object must contain the property `node` that identifies the node.
//  * @typedef {Node[]} Path
//  */

// /**
//  * Checks whether the given path is a valid path through the graph.
//  * @param {PortGraph} graph The graph in which the path is located.
//  * @param {Path} path The actual path to test.
//  * @returns True if every node in the path is defined in the graph and
//  * if every successor of a node in the path is connected via an edge.
//  */
// export function isValid (graph, path) {
//   return _.reduce(path, (acc, n) => {
//     return {
//       predecessor: n,
//       valid: acc.valid &&
//         Graph.hasNode(graph, n) &&
//         (!acc.predecessor || Graph.areConnected(acc.predecessor, n))
//     }
//   }, {predecessor: null, valid: true}).valid
// }

// /**
//  * For two pathes find the latest split that separates those paths.
//  *
//  * @param {Path} path1 The first path (order independent)
//  * @param {Path} path2 The second path (order independent)
//  * @return {Node} Returns the id of the latest common node, that separates the two pathes.
//  * If both paths are equal it returns undefined.
// */
// export function latestSplit (path1, path2) {
//   return Node.id(_.findLastIndex(path1, (n) => {
//     return _.find(path2, (n2) => Node.equal(n, n2))
//   }))
// }

// /**
//  * Tests if the two pathes are equal (start and end in the same nodes and go through the exact same nodes on their way).
//  * It does not check if the taken ports are always the same.
//  * @param {Path} path1 A path as an array of strings or an array of {node: name, ...}.
//  * @param {Path} path2 The path to compare path1 to. Must have the same format as path1.
//  * @return {boolean} A boolean that is true if the paths are equal and false otherwise.
//  */
// export function equal (path1, path2) {
//   return _.differenceBy(path1, path2, Node.id).length === 0 &&
//     _.differenceBy(path2, path1, Node.id).length === 0
// }
