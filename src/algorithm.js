/**
 * A collection of algorithms that act on the port graph.
 */

/*
import debugLog from 'debug'

const debug = debugLog('graphtools')*/

/**
 * Returns a topological sorting of the graph.
 * @param {PortGraph} graph The graph.
 * @return {string[]} A sorting of the nodes given by an array of their IDs.
 * @throws {Error} If the graph has loops.
 */
export function topologicalSort (graph) {
  return null // TODO
/*  try {
  } catch (err) {
    debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    fs.writeFileSync('test.json', JSON.stringify(graphlib.json.write(graph)))
    throw Error('[topoSort] Cannot calculate toplogical sorting, graph contains loop.\n' + JSON.stringify(graphlib.alg.findCycles(graph)))
  }*/
}
