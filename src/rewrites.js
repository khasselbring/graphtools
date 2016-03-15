
import {edit, finalize, prefixNode, addParent} from './utils'
import _ from 'lodash'

export function prefixMapping (parent, changeSet) {
  return _.map(changeSet.nodes, (n) => ({previous: n.v, after: prefixNode(parent, n).v}))
}

export function prefixingFunction (parent, changeSet) {
  var nameMap = _.keyBy(prefixMapping(parent, changeSet), 'previous')
  return (name) => {
    if (nameMap[name]) return nameMap[name].after
    else return name
  }
}

export function addParentToChangeSet (parent, changeSet) {
  var map = prefixingFunction(parent, changeSet)
  return _.merge({},
    changeSet,
    {
      nodes: _(changeSet.nodes)
        .map((n) => prefixNode(parent, n))
        .map((n) => addParent(parent, n))
        .value(),
      edges: _(changeSet.edges)
        .map((e) => _.merge({}, e, {v: map(e.v), w: map(e.w)}))
        .value()
    })
}

export function edgeConnectors (graph, node, edges) {
  return _.map(edges, (e, key) => {
    if (graph.node(node).inputPorts[key]) {
      return {v: node, w: e.node, value: {outPort: key, inPort: e.port}}
    } else if (graph.node(node).outputPorts[key]) {
      return {v: e.node, w: node, value: {outPort: e.pord, inPort: key}}
    } else {
      throw new Error(`unkown port ${key} on node ${node}`)
    }
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
