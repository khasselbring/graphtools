
import * as changeSet from '../changeSet'
import curry from 'lodash/fp/curry'

/**
 * Returns the meta information encoded in the graph
 * @param {PortGraph} graph The graph.
 * @returns {object} An object with all meta information keys.
 */
export function meta (graph) {
  return graph.MetaInformation
}

/**
 * Sets the meta information in the graph for the given key to the value
 * @param {PortGraph} graph The graph.
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @returns A new graph with the applied changes.
 */
export const setMeta = curry((key, value, graph) => {
  return changeSet.applyChangeSet(graph, changeSet.addMetaInformation(key, value))
})
