/**
 * Format graph outputs
 */

import {nodes, node} from './graph/node'
import {predecessors} from './graph/connections'

/**
 * Print a compound layer as string
 * @param {Portgraph} compound A graph (i.e. the root element or any of the compounds)
 * @returns {String} An ASCII representation of the graph in dot format..
 */
export function graphLayerToString (compound) {
  return 'digraph {\n' + nodes(compound).reduce((str, n) =>
    str + '\n' + predecessors(n, compound).map((p) => '"' + node(p, compound).componentId + '" -> "' + n.componentId + '"').join('\n')
    , '') + '\n}'
}

export function graphToString (graph) {
  return JSON.stringify(graph)
}
