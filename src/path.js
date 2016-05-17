
import _ from 'lodash'

/** for two pathes find the latest split that separates those paths */
export function latestSplit (graph, path1, path2) {
  return _.findLastIndex(path1, (n) => {
    return _.find(path2, (n2) => n2 === n)
  })
}
