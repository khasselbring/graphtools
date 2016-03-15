
import {edit, finalize, prefixNode} from './utils'
import _ from 'lodash'

export function prefixMapping (parent, changeSet) {
  return _.map(changeSet.nodes, (n) => ({previous: n.v, after: prefixNode(parent, n).v}))
}

export function addParentToChangeSet (parent, changeSet) {
  var nameMap = _.keyBy(prefixMapping(parent, changeSet), 'previous')
  console.log(nameMap)
  var map = (name) => {
    if (nameMap[name]) return nameMap[name].after
    else return name
  }
  return _.merge({},
    changeSet,
    {
      nodes: _(changeSet.nodes)
        .map((n) => prefixNode(parent, n))
        .map((n) => _.merge({}, n, {parent: parent}))
        .value(),
      edges: _(changeSet.edges)
        .map((e) => _.merge({}, e, {v: map(e.v), w: map(e.w)}))
        .value()
    })
}

/**
 * applys a lambda function with one input stream and one output stream
 * on an input stream
 */
export function apply (graph, node, changeSet) {
  var editGraph = edit(graph)
  var withParents = addParentToChangeSet(node, changeSet)
  var rewritten = _.merge({},
    editGraph,
    {
      nodes: _.concat(editGraph.nodes, withParents.nodes),
      edges: _.concat(editGraph.edges, withParents.edges)
    })
  return finalize(rewritten)
}
