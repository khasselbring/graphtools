
/** @module Walk */

import _ from 'lodash'

/**
 * Gets the predecessors of the node over the port `port`.
 * @param {Graphlib} graph The graph
 * @param {string} node A string identifying the node.
 * @param {string} port The port to use to find predecessors
 * @param {string} [layer] The connection layer on which to look for the connection. Default is the 'dataflow' layer.
 * @returns {Object[]} It returns an array of objects in the following
 * format: `{node: 'NODE_ID', port: 'OUTPUT_PORT', edge: EDGE}`. It contains the predecessor node, the output
 * port it came in through (the port is always one of the predecessor) and the edge.
 */
export function predecessor (graph, node, port, layer = 'dataflow') {
  return _(graph.Edges)
    .filter((e) => e.layer === layer)
    .filter((e) => e.to === node && e.inPort === port)
    .map((e) => ({node: e.from, port: e.outPort, edge: e}))
    .value()
}

/**
 * Gets the successors of the node over the port `port`.
 * @param {Graphlib} graph The graph
 * @param {string} node A string identifying the node.
 * @param {string} port The port to use to find successors
 * @param {string} [layer] The connection layer on which to look for the connection. Default is the 'dataflow' layer.
 * @returns {Object[]} It returns an array of objects in the following
 * format: `{node: 'NODE_ID', port: 'OUTPUT_PORT', edge: EDGE}`. It contains the successor node, the output
 * port it came in through (the port is always one of the successor) and the edge.
 */
export function successor (graph, node, port, layer = 'dataflow') {
  return _(graph.Edges)
    .filter((e) => e.layer === layer)
    .filter((e) => e.from === node && e.outPort === port)
    .map((e) => ({node: e.to, port: e.inPort, edge: e}))
    .value()
}

/**
 * Tries to follows a given path through the graph starting at `node`. It uses the successor function to track the neighbors.
 * @param {Graphlib} graph The graph
 * @param {string|Object} node The node can either be
 *   - the name of the starting node
 *   - an object `{node: 'START', port: 'USE_PORT'}` that forces the walk to use USE_PORT for the first node.
 * @param {string[]|function} path The path itself can be
 *   - an array of ports that should be followed (even if the USE_PORT field is set, you must start with it as the first port).
 *     If it is not possible to follow the port a empty list of paths is returned.
 *   - a function that is called for every node on the path and that returns
 *     + a list of ports to continue with
 *     + an empty list to stop the walk
 *     + `null` to discard the branch.
 *
 *   The function takes three arguments: `graph`, `node`, `port`, where the `node` is the name of the current node on the path.
 *   The port is the port it used to get to node.
 * @param {Object} [options = {keepPorts: false}] An optional object that can have the following properties
 *   - `keepPorts`: If this field is true, walk will return a list of objects that each have the format:
 *      `{node: 'NODE_ID', port: 'INPUT_PORT', edge: EDGE}`. It will not have an edge object for the first node on the path.
 * @returns {string[]|object[]} It returns the list of nodes on the path.
 */
export function walk (graph, node, path, options = {keepPorts: false}) {
  return generalWalk(graph, node, path, _.partial(successor, _, _, _, _, options), options)
}

/**
 * Tries to follows a given path through the graph starting at `node`. It uses the predecessor function to track the neighbors.
 * @param {Graphlib} graph The graph
 * @param {string|Object} node The node can either be
 *   - the name of the starting node
 *   - an object `{node: 'START', port: 'USE_PORT'}` that forces the walk to use USE_PORT for the first node.
 * @param {string[]|function} path The path itself can be
 *   - an array of ports that should be followed (even if the USE_PORT field is set, you must start with it as the first port).
 *     If it is not possible to follow the port a empty list of paths is returned.
 *   - a function that is called for every node on the path and that returns
 *     + a list of ports to continue with
 *     + an empty list to stop the walk
 *     + `null` to discard the branch.
 *
 *   The function takes three arguments: `graph`, `node`, `port`, where the `node` is the name of the current node on the path.
 *   The port is the port it used to get to node.
 * @param {Object} [options = {keepPorts: false}] An optional object that can have the following properties
 *   - `keepPorts`: If this field is true, walk will return a list of objects that each have the format:
 *      `{node: 'NODE_ID', port: 'INPUT_PORT', edge: EDGE}`. It will not have an edge object for the first node on the path.
 * @returns {string[]|object[]} It returns the list of nodes on the path.
 */
export function walkBack (graph, node, path, options = {keepPorts: false}) {
  return _.map(generalWalk(graph, node, path, _.partial(predecessor, _, _, _, _, options), options), _.reverse)
}

/**
 * returns a list of adjacent nodes for one port of a node
 */
export function adjacentNode (graph, node, port, edgeFollow) {
  var adjacents = edgeFollow(graph, node, port)
  if (adjacents.length === 0) return
  else return adjacents
}

/**
 * returns a list of adjacent of a node
 */
export function adjacentNodes (graph, node, ports, edgeFollow) {
  if (!Array.isArray(ports)) {
    ports = [ports]
  }
  var nodes = _.flatten(_.compact(_.map(ports, _.partial(adjacentNode, graph, node, _, edgeFollow))))
  if (nodes.length === 0) return
  return nodes
}

function generalWalk (graph, node, path, edgeFollow, options) {
  var res
  if (typeof (node) !== 'object') {
    node = {node}
  }
  if (Array.isArray(path)) {
    res = arrayWalk(graph, node, path, edgeFollow)
  } else if (typeof (path) === 'function') {
    res = functionWalk(graph, node, path, edgeFollow)
  } else {
    return undefined
  }
  if (options.keepPorts) {
    return res
  } else {
    return pickNodeNames(res)
  }
}

function pickNodeNames (pathes) {
  return _.map(pathes, _.partial(_.map, _, 'node'))
}

function functionWalk (graph, node, pathFn, edgeFollow) {
  var followPorts = pathFn(graph, node.node, node.port)
  if (!followPorts) {
    return []
  } else if (followPorts.length === 0) {
    return [[node]]
  }
  var nextNodes = adjacentNodes(graph, node.node, followPorts, edgeFollow)
  var paths = _(nextNodes)
    .map((node) => functionWalk(graph, node, pathFn, edgeFollow))
    .flattenDepth(1)
    .compact()
    .value()
  return _.map(paths, (path) => _.concat([node], path))
}

function arrayWalk (graph, node, pathArray, edgeFollow) {
  return _.reduce(pathArray, (nodes, p) => {
    return _(nodes)
      .map((path) => {
        var curNode = _.last(path)
        var nextNodes = adjacentNodes(graph, curNode.node, p, edgeFollow)
        if (!nextNodes) return
        return _.map(nextNodes, (n) => _.concat(path, n))
      })
      .flatten()
      .compact()
      .value()
  }, [[node]])
}
