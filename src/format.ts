/**
 * Format graph outputs
 */

import {component} from './node'
import {nodes, node} from './graph/node'
import {Node} from './node'
import {Compound} from './compound'
import {Portgraph} from './graph/graph'
import {predecessors} from './graph/connections'

/**
 * Print a compound layer as string
 * @param {Node} node A graph (i.e. the root element or any of the compounds)
 * @returns {String} An ASCII representation of the graph in dot format..
 */
export function graphLayerToString (compound:Node) {
  return 'digraph {\n' + nodes(compound).reduce((str, n) =>
    str + '\n' + predecessors(n, compound).map((p) => '"' + component(node(p, compound))+ '" -> "' + component(n) + '"').join('\n')
    , '') + '\n}'
}

export function graphToString (graph:Node) {
  return JSON.stringify(graph)
}
