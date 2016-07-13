/**
 * A collection of algorithms that act on the port graph.
 */

import graphlib from 'graphlib'
import {clone} from './graph'
import * as utils from './utils'
import fs from 'fs'
import _ from 'lodash'

/**
 * Removes all continuations from a graph (only for debug purposes)
 * @param {Graphlib} graph The graph
 * @returns {Graphlib} A graph that has no continuations edges
 */
export function removeContinuations (graph) {
  var tGraph = clone(graph)
  _.each(tGraph.edges(), (e) => {
    if (utils.isContinuation(tGraph, e)) {
      tGraph.removeEdge(e)
    }
  })
  return tGraph
}

/**
 * Returns a topological sorting of the graph. Removes all continuations before calculating the topological sorting.
 * @param {Graphlib} graph The graph.
 * @return {string[]} A sorting of the nodes.
 * @throws {Error} If the graph has loops.
 */
export function topologicalSort (graph) {
  try {
    var tGraph = removeContinuations(graph)
    return graphlib.alg.topsort(tGraph)
  } catch (err) {
    fs.writeFileSync('test.json', JSON.stringify(graphlib.json.write(tGraph)))
    throw Error('[topoSort] Cannot calculate toplogical sorting, graph contains loop.\n' + JSON.stringify(graphlib.alg.findCycles(tGraph)))
  }
}
