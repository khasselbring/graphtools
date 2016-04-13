
import {edit, finalize, prefixNode, addParent, hierarchyConnection} from './utils'
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
      return {v: e.node, w: node, value: {outPort: e.port, inPort: key}}
    } else {
      throw new Error(`unkown port ${key} on node ${node}`)
    }
  })
}

function createConformEdges (graph, edgeHierarchy) {
  var eh = edgeHierarchy
  var linkId = `[${eh[0].v}@${eh[2].outPort}→${eh[0].w}@${eh[2].inPort}]`
  var start = {v: eh[0].v, w: eh[1][0], value: {outPort: graph.edge(eh[0]).outPort, inPort: linkId}}
  var lastEh = eh[1][eh[1].length - 1]
  var end = {v: lastEh, w: eh[0].w, value: {outPort: linkId, inPort: graph.edge(eh[0]).inPort}}
  var pairs = _.zip(eh[1], _.tail(eh[1])).slice(0, -1)
  return _.concat([start],
    _.map(pairs, (p) => ({v: p[0], w: p[1], value: {outPort: linkId, inPort: linkId}})),
    [end])
}

function convertNonConformEdgeList (graph, edges) {
  var edgeLinks = _.map(edges, (e) => hierarchyConnection(graph, e))
  var edgeValues = _.map(edges, (e) => graph.edge(e))
  var edgeHierarchy = _.zip(edges, edgeLinks, edgeValues)
  return _.map(edgeHierarchy, _.partial(createConformEdges, graph))
}

/**
 * Add links to nodes that are on the edges to allow calling
 */
/* function addConformityLinks (graph, edges) {
  var nonConfEdges = _.filter(edges, (e) => isConformityEdge)
} */

export function rewriteNonConformEdges (graph, edges) {
  var editGraph = edit(graph)
  var newEdges = convertNonConformEdgeList(graph, edges)
  // var nodes = addConformityLinks(graph, newEdges)
  console.log(JSON.stringify(newEdges, null, 2))
  editGraph.edges = _.concat(editGraph.edges, _.flatten(newEdges))
  return finalize(editGraph)
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
