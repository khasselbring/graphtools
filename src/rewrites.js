
import {edit, finalize, prefixNode, addParent, rawHierarchyConnection, linkName} from './utils'
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

function linkEdge ([h1, h2]) {
  return {v: h1.node, w: h2.node, value: {outPort: h1.port, outType: h1.type, inPort: h2.port, inType: h2.type}}
}

function convertLinkViaHierarchy (graph, link, hierarchy, name) {
  if (hierarchy.length === 0) {
    return {edges: [link], ports: []}
  } else {
    var extraPorts = _.map(hierarchy, (e) => _.assign(e, {port: name}))
    var edgeHierarchy = _.concat([{node: link.v, port: link.value.outPort}],
      extraPorts,
      [{node: link.w, port: link.value.inPort}])
    var edges = _.zip(edgeHierarchy, _.tail(edgeHierarchy))
      .slice(0, -1)
      .map(linkEdge)
    return {edges: edges, ports: extraPorts}
  }
}

function linkEdgePortConvert (graph, link) {
  var hierarchy = rawHierarchyConnection(graph, link)
  var name = linkName(link)
  return convertLinkViaHierarchy(graph, link, hierarchy, name)
}

/**
 * A link is a connection between two nodes that do not necessarily have the same parent
 * A edge is a connection between two nodes that share a common parent
 * This function returns a list of edges for a link (length >= 1)
 */
export function linkToEdges (graph, link) {
  return linkEdgePortConvert(graph, link).edges
}

export function linkToPorts (graph, link) {
  return linkEdgePortConvert(graph, link).ports
}

function convertNonConformEdgeList (graph, links) {
  var edgePortLinks = _.map(links, (e) => linkEdgePortConvert(graph, e))
  return edgePortLinks
}

function linksCPorts (linkList) {
  var links = _(linkList)
    .map('ports')
    .flatten()
    .groupBy('node')
    .map((g) => _.merge({}, _.omit(g[0], 'port'), {links: _.uniqBy(g, (e) => g.port)}))
    .keyBy('node')
    .value()
  return links
}

export function rewriteNonConformEdges (graph, edges) {
  var editGraph = edit(graph)
  var linkEdges = convertNonConformEdgeList(graph, edges)
  var newEdges = _(linkEdges).map('edges').flatten().value()
  var nodes = linksCPorts(linkEdges)
  editGraph.edges = _.concat(editGraph.edges, newEdges)
  editGraph.nodes = _.map(editGraph.nodes, (n) => {
    if (_.has(nodes, n.v)) {
      return _.assign(n, {value: {links: nodes[n.v].links}})
    } else {
      return n
    }
  })
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
