/* Not implemented yet... */
/** @module Walk */

// import curry from 'lodash/fp/curry'
// import _ from 'lodash'

// /**
//  * Gets the predecessors of the node over the port `port`.
//  * @param {string} node A string identifying the node.
//  * @param {string} port The port to use to find predecessors
//  * @param {string} layer The connection layer on which to look for the connection.
//  * @param {PortGraph} graph The graph
//  * @returns {Object[]} It returns an array of objects in the following
//  * format: `{port: <port>, edge: <edge>}`. It contains the predecessor port and the edge.
//  */
// export const predecessorOn = curry((node, port, layer, graph) => {
//   return _(graph.edges)
//     .filter((e) => e.layer === layer)
//     .filter((e) => e.to.node === node && e.to.port === port)
//     .map((e) => ({node: e.from, edge: e}))
//     .value()
// })

// /**
//  * Gets the predecessors of the node over the port `port` on the dataflow layer.
//  * @param {string} node A string identifying the node.
//  * @param {string} port The port to use to find predecessors
//  * @returns {Object[]} It returns an array of objects in the following
//  * @param {PortGraph} graph The graph
//  * format: `{port: <port>, edge: <edge>}`. It contains the predecessor port and the edge.
//  */
// export const predecessor = curry((node, port, graph) => {
//   return predecessorOn(node, port, 'dataflow', graph)
// })

// /**
//  * Gets the successors of the node over the port `port`.
//  * @param {string} node A string identifying the node.
//  * @param {string} port The port to use to find successors
//  * @param {string} layer The connection layer on which to look for the connection.
//  * @param {PortGraph} graph The graph
//  * @returns {Object[]} It returns an array of objects in the following
//  * format: `{port: <port>, edge: <edge>}`. It contains the predecessor port and the edge.
//  */
// export const successorOn = curry((node, port, layer, graph) => {
//   return _(graph.edges)
//     .filter((e) => e.layer === layer)
//     .filter((e) => e.from.node === node && e.from.port === port)
//     .map((e) => ({port: e.to, edge: e}))
//     .value()
// })

// /**
//  * Gets the successors of the node over the port `port`.
//  * @param {string} node A string identifying the node.
//  * @param {string} port The port to use to find successors
//  * @param {PortGraph} graph The graph
//  * @returns {Object[]} It returns an array of objects in the following
//  * format: `{port: <port>, edge: <edge>}`. It contains the predecessor port and the edge.
//  */
// export const successor = curry((node, port, graph) => {
//   return successor(node, port, 'dataflow', graph)
// })

// /**
//  * Tries to follows a given path through the graph starting at `node`. It uses the successor function to track the neighbors.
//  * @param {PortGraph} graph The graph
//  * @param {string|Object} node The node can either be
//  *   - the name of the starting node
//  *   - an object `{node: 'START', port: 'USE_PORT'}` that forces the walk to use USE_PORT for the first node.
//  * @param {string[]|function} path The path itself can be
//  *   - an array of ports that should be followed (even if the USE_PORT field is set, you must start with it as the first port).
//  *     If it is not possible to follow the port a empty list of paths is returned.
//  *   - a function that is called for every node on the path and that returns
//  *     + a list of ports to continue with
//  *     + an empty list to stop the walk
//  *     + `null` to discard the branch.
//  *
//  *   The function takes three arguments: `graph`, `node`, `port`, where the `node` is the name of the current node on the path.
//  *   The port is the port it used to get to node.
//  * @param {Object} [options = {keepPorts: false}] An optional object that can have the following properties
//  *   - `keepPorts`: If this field is true, walk will return a list of objects that each have the format:
//  *      `{node: 'NODE_ID', port: 'INPUT_PORT', edge: EDGE}`. It will not have an edge object for the first node on the path.
//  * @returns {string[]|object[]} It returns the list of nodes on the path.
//  */
// export const walk = curry((node, path, graph) => {
//   return generalWalk(node, path, successor, graph)
// })

// /**
//  * Tries to follows a given path through the graph starting at `node`. It uses the predecessor function to track the neighbors.
//  * @param {Graphlib} graph The graph
//  * @param {string|Object} node The node can either be
//  *   - the name of the starting node
//  *   - an object `{node: 'START', port: 'USE_PORT'}` that forces the walk to use USE_PORT for the first node.
//  * @param {string[]|function} path The path itself can be
//  *   - an array of ports that should be followed (even if the USE_PORT field is set, you must start with it as the first port).
//  *     If it is not possible to follow the port a empty list of paths is returned.
//  *   - a function that is called for every node on the path and that returns
//  *     + a list of ports to continue with
//  *     + an empty list to stop the walk
//  *     + `null` to discard the branch.
//  *
//  *   The function takes three arguments: `graph`, `node`, `port`, where the `node` is the name of the current node on the path.
//  *   The port is the port it used to get to node.
//  * @param {Object} [options = {keepPorts: false}] An optional object that can have the following properties
//  *   - `keepPorts`: If this field is true, walk will return a list of objects that each have the format:
//  *      `{node: 'NODE_ID', port: 'INPUT_PORT', edge: EDGE}`. It will not have an edge object for the first node on the path.
//  * @returns {string[]|object[]} It returns the list of nodes on the path.
//  */
// export const walkBack = curry((node, path, graph) => {
//   return _.map(generalWalk(node, path, predecessor, graph), _.reverse)
// })

// /**
//  * returns a list of adjacent nodes for one port of a node
//  */
// export const adjacentNode = curry((node, port, edgeFollow, graph) => {
//   var adjacents = edgeFollow(node, port, graph)
//   if (adjacents.length === 0) return
//   else return adjacents
// })

// /**
//  * returns a list of adjacent of a node
//  */
// export const adjacentNodes = curry((node, ports, edgeFollow, graph) => {
//   if (!Array.isArray(ports)) {
//     ports = [ports]
//   }
//   var nodes = _.flatten(_.compact(_.map(ports, _.partial(adjacentNode, node, _, edgeFollow, graph))))
//   if (nodes.length === 0) return
//   return nodes
// })

// function generalWalk (node, path, edgeFollow, graph) {
//   if (typeof (node) !== 'object') {
//     node = {node}
//   }
//   if (Array.isArray(path)) {
//     return arrayWalk(node, path, edgeFollow, graph)
//   } else if (typeof (path) === 'function') {
//     return functionWalk(node, path, edgeFollow, graph)
//   } else {
//     return undefined
//   }
// }

// function functionWalk (node, pathFn, edgeFollow, graph) {
//   var followPorts = pathFn(node.node, node.port, graph)
//   if (!followPorts) {
//     return []
//   } else if (followPorts.length === 0) {
//     return [[node]]
//   }
//   var nextNodes = adjacentNodes(node.node, followPorts, edgeFollow, graph)
//   var paths = _(nextNodes)
//     .map((node) => functionWalk(node, pathFn, edgeFollow, graph))
//     .flattenDepth(1)
//     .compact()
//     .value()
//   return _.map(paths, (path) => _.concat([node], path))
// }

// function arrayWalk (node, pathArray, edgeFollow, graph) {
//   return _.reduce(pathArray, (nodes, p) => {
//     return _(nodes)
//       .map((path) => {
//         var curNode = _.last(path)
//         var nextNodes = adjacentNodes(curNode.node, p, edgeFollow, graph)
//         if (!nextNodes) return
//         return _.map(nextNodes, (n) => _.concat(path, n))
//       })
//       .flatten()
//       .compact()
//       .value()
//   }, [[node]])
// }
