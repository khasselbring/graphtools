
import {edit, finalize, prefixNode, addParent, rawHierarchyConnection, isConformityEdge, isConformityPort, linkName} from './utils'
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

function connectHierarchyEdges (graph, edgeHierarchy) {
  var eh = edgeHierarchy
  var name = eh[1][0].node
  var last = eh[1].length - 1
  var linkId = `[${eh[0].v}@${eh[2].outPort}→${eh[0].w}@${eh[2].inPort}`
  var start = {v: eh[0].v, w: name, value: {outPort: graph.edge(eh[0]).outPort, inPort: linkId, inType: 'out'}}
  var lastEh = eh[1][last]
  var end = {v: lastEh.node, w: eh[0].w, value: {outPort: linkId, outType: 'in', inPort: graph.edge(eh[0]).inPort}}
  var pairs = _.zip(eh[1], _.tail(eh[1])).slice(0, -1)
  return _.concat([start],
    _.map(pairs, (p) => ({v: p[0].node, w: p[1].node, value: {outPort: linkId, outType: p[0].type, inPort: linkId, inType: p[1].type}})),
    [end])
}

function linkConnectionViaHierarchy (graph, link, hierarchy, name) {
  if (hierarchy.length === 0) {
    return link
  }
}

/**
 * A link is a connection between two nodes that do not necessarily have the same parent
 * A edge is a connection between two nodes that share a common parent
 * This function returns a list of edges for a link (length >= 1)
 */
export function linkToEdges (graph, link) {
  var hierarchy = rawHierarchyConnection(graph, link)
  var name = linkName(graph, link)
}

function convertNonConformEdgeList (graph, edges) {
  var edgeLinks = _.map(edges, (e) => rawHierarchyConnection(graph, e))
  console.log(edgeLinks)
  var edgeValues = _.map(edges, (e) => graph.edge(e))
  var edgeHierarchy = _.zip(edges, edgeLinks, edgeValues)
  return _.flatten(_.map(edgeHierarchy, _.partial(connectHierarchyEdges, graph)))
}
/*
function addConformityLink (graph, node, port) {
  var nodeVal = graph.node(node)
  if (!isConformityPort(port)) return
  return {
    v: node,
    value: _.merge({}, nodeVal, {links: _.concat(nodeVal.links || [], [port])}),
    parent: graph.parent(node)
  }
}

/**
 * Add links to nodes that are on the edges to allow calling
 *//*
function addConformityLinks (graph, edges) {
  var nonConfEdges = _.filter(edges, (e) => isConformityEdge)
  var nodes = _(nonConfEdges)
    .map((e) => {
      return _([[e.v, e.value.outPort], [e.w, e.value.inPort]])
        .map((v) => {
          var node = addConformityLink(graph, v[0], v[1])
          return (node) ? [v[1], node] : null
        })
        .compact()
        .value()
    })
    .flatten()
    .uniqBy((n) => {
      return n[0] + n[1].v
    })
    .map((n) => n[1])
    .flatten()
    .value()
  console.log(nodes)
  return nodes
}
*/
function nodeCPorts (node, port) {
  if (isConformityPort(port)) {
    return {node: node, port: port}
  }
}

function linkCPorts (link) {
  if (isConformityEdge(link)) {
    return _.compact([nodeCPorts(link.v, link.value.outPort), nodeCPorts(link.w, link.value.inPort)])
  }
}

function linksCPorts (linkList) {
  var links = _(linkList)
    .map(linkCPorts)
    .flatten()
    .groupBy('node')
    .map((g) => _.merge({}, _.omit(g[0], 'port'), {links: _.uniq(_.map(g, 'port'))}))
    .keyBy('node')
    .value()
  return links
}

export function rewriteNonConformEdges (graph, edges) {
  var editGraph = edit(graph)
  var linkEdges = convertNonConformEdgeList(graph, edges)
  /* var newNodes = addConformityLinks(graph, linkEdges)
  console.log(JSON.stringify(linkEdges, null, 2))
  console.log(newNodes)*/
  var nodes = linksCPorts(linkEdges)
  console.log(nodes)
  editGraph.edges = _.concat(editGraph.edges, linkEdges)
  editGraph.nodes = _.map(editGraph.nodes, (n) => {
    if (_.has(nodes, n.v)) {
      return _.assign(n, {value: {links: nodes[n.v].links}})
    } else {
      return n
    }
  })
  console.log(editGraph.nodes)
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
