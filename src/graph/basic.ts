/// <reference path="graph.ts" />
/**
 * @overview Includes basic graph functions like creating a graph or cloning it.
 */

import cloneObj from 'lodash/fp/clone'
import isEqual from 'lodash/fp/isEqual'
import {create} from '../compound'
import {setMetaKey} from './meta.js'
import {packageVersion} from '../internals'
import {Portgraph} from './graph'
import {Node} from '../node'

/**
 * Creates a new graph that has the exact same nodes and edges.
 * @param {Portgraph} graph The graph to clone
 * @returns {Portgraph} A clone of the input graph.
 */
export function clone (graph: Portgraph) {
  return cloneObj(graph)
}

/**
 * Compares two graphs for structural equality.
 * @param {Portgraph} graph1 One of the graphs to compare.
 * @param {Portgraph} graph2 The other the graph to compare.
 * @returns {boolean} True if both graphs are structually equal, false otherwise.
 */
export const equal = (graph1: Node, graph2: Node) => {
  return isEqual(graph1, graph2)
}

export const compound = create

/**
 * Returns a new empty graph.
 * @returns {Portgraph} A new empty port graph.
 */
export function empty () {
  return setMetaKey('version', packageVersion())(create())
}
