
import _ from 'lodash'

/** for two pathes find the latest split that separates those paths */
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

export function equal (path1, path2) {
  if (typeof (path1[0]) === 'string') {
    return _.difference(path1, path2).length === 0 && _.difference(path2, path1).length === 0
  } else {
    return _.differenceBy(path1, path2, (p) => p.node).length === 0 &&
      _.differenceBy(path2, path1, (p) => p.node).length === 0
  }
}
