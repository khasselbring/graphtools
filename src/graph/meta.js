
import * as changeSet from '../changeSet'
import curry from 'lodash/fp/curry'

/**
 * Returns the meta information encoded in the graph
 * @param {PortGraph} graph The graph.
 * @returns {object} An object with all meta information keys.
 */
export function meta (graph) {
  return graph.metaInformation
}

/**
 * @function
 * @name setMetaKey
 * @description Sets the meta information in the graph for the given key to the value
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @param {PortGraph} graph The graph.
 * @returns A new graph with the applied changes.
 */
export const setMetaKey = curry((key, value, graph) => {
  return changeSet.applyChangeSet(graph, changeSet.addMetaInformation(key, value))
})

/**
 * @function
 * @name setMetaKey
 * @description Set meta information in the graph
 * @param {Object} obj An object with all keys that shall be changed.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph with the applied changes.
 */
export const setMeta = curry((obj, graph) => {
  return changeSet.applyChangeSet(graph, changeSet.setMetaInformation(obj))
})
