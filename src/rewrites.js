
import {edit, finalize, prefixNode} from './utils'
import _ from 'lodash'

export function prefixChangeSet (prefix, changeSet) {
  changeSet.nodes = _.map(changeSet.nodes, (n) => {
    return prefixNode(prefix, n)
  })
}

/**
 * applys a lambda function with one input stream and one output stream
 * on an input stream
 */
export function apply (graph, node, changeSet) {
  var editGraph = edit(graph)
  prefixed = prefixChangeSet(node, changeSet)
  editGraph.nodes = _.concat(_.map(changeSet.nodes, (n) => {
    return _.merge({}, n, {parent: node, v: `${node}:${n.v}`})
  }))
  editGraph.edges = _.concat(editGraph.edges, changeSet.edges)
  return finalize(editGraph)
}
