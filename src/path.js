
import _ from 'lodash'

/**
 * For two pathes find the latest split that separates those paths.
 *
 * @param {Object} graph The graph in which the pathes are
 * @param {[string]|[Object]} path1 The first path (order independent)
 * @param {[string]|[Object]} path2 The second path (order independent)
 * @return {string|Object} Returns the latest common node, that separates the two pathes. If both paths are equal it returns undefined.
*/
export function latestSplit (graph, path1, path2) {
  if (typeof (path1[0]) === 'string') {
    return _.findLastIndex(path1, (n) => {
      return _.find(path2, (n2) => n2 === n)
    })
  } else {
    return _.findLastIndex(path1, (n) => {
      return _.find(path2, (n2) => n2.node === n.node)
    })
  }
}

/**
 * Tests if the two pathes are equal (start and end in the same nodes and go through the exact same nodes on their way).
 * It does not check if the taken ports are always the same.
 * @param {[string]|[Object]} path1 A path as an array of strings or an array of {node: name, ...}.
 * @param {[string]|[Object]} path2 The path to compare path1 to. Must have the same format as path1.
 * @return {boolean} A boolean that is true if the paths are equal and false otherwise.
 */
export function equal (path1, path2) {
  if (typeof (path1[0]) === 'string') {
    return _.difference(path1, path2).length === 0 && _.difference(path2, path1).length === 0
  } else {
    return _.differenceBy(path1, path2, (p) => p.node).length === 0 &&
      _.differenceBy(path2, path1, (p) => p.node).length === 0
  }
}
