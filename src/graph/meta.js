
import * as changeSet from '../changeSet'
import curry from 'lodash/fp/curry'
import get from 'lodash/fp/get'
import {replaceNode, node} from './node'

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
 * @returns A new graph with the applied changes. If there was already an value with this key
 * it gets overwritten. Use updateMetaKey to only change specific parts.
 */
export const setMetaKey = curry((key, value, graph) => {
  return changeSet.applyChangeSets(graph, [
    changeSet.removeMetaInformation(key),
    changeSet.addMetaInformation(key, value)
  ])
})

/**
 * @function
 * @name updateMetaKey
 * @description Updates the meta information in the graph for the given key to the value
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @param {PortGraph} graph The graph.
 * @returns A new graph with the applied changes. If there was already an value with this key
 * it gets updated. If there was no value at this key, the key will be created. If you want
 * to replace the existing value use `setMetaKey`.
 */
export const updateMetaKey = curry((key, value, graph) => {
  return changeSet.applyChangeSets(graph, [
    changeSet.addMetaInformation(key, value)
  ])
})

/**
 * @function
 * @name removeMetaKey
 * @description Removes the meta information in the graph for the given key to the value
 * @param {string} key The meta key that gets removed.
 * @param {PortGraph} graph The graph.
 * @returns A new graph with the applied changes. The key will be undefined from in the graph.
 */
export const removeMetaKey = curry((key, graph) => {
  return changeSet.applyChangeSet(graph, changeSet.removeMetaInformation(key))
})

/**
 * @function
 * @name setNodeMetaKey
 * @description Sets the meta information in the graph for the given key to the value
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @param {Location} loc A location identifying the node.
 * @param {PortGraph} graph The graph.
 * @returns A new graph with the applied changes. If there was already an value with this key
 * it gets overwritten. Use updateNodeMetaKey to only change specific parts.
 */
export const setNodeMetaKey = curry((key, value, loc, graph) => {
  return replaceNode(loc, setMetaKey(key, value, node(loc, graph)), graph)
})

/**
 * @function
 * @name updateNodeMetaKey
 * @description Updates the meta information in the graph for the given key to the value
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @param {Location} loc A location identifying the node.
 * @param {PortGraph} graph The graph.
 * @returns A new graph with the applied changes. f there was already an value with this key
 * it gets updated. If there was no value at this key, the key will be created. If you want
 * to replace the existing value use `setNodeMetaKey`.
 */
export const updateNodeMetaKey = curry((key, value, loc, graph) => {
  return replaceNode(loc, updateMetaKey(key, value, node(loc, graph)), graph)
})

/**
 * @function
 * @name removeNodeMetaKey
 * @description Removes the meta information for a node in the graph for the given key to the value
 * @param {string} key The meta key that gets removed.
 * @param {Location} loc A location identifying the node.
 * @param {PortGraph} graph The graph.
 * @returns A new graph with the applied changes. The key will be undefined from in the graph.
 */
export const removeNodeMetaKey = curry((key, loc, graph) => {
  return replaceNode(loc, removeMetaKey(key, node(loc, graph)), graph)
})

/**
 * @function
 * @name getMetaKey
 * @description Gets the meta information in the graph for the given key
 * @param {string} key The meta key for the value.
 * @param {PortGraph} graph The graph.
 * @returns The value of the meta key of undefined if the key does not exist.
 */
export const getMetaKey = curry((key, graph) => {
  return get(key, graph.metaInformation)
})

/**
 * @function
 * @name getNodeMetaKey
 * @description Gets the meta information for a node in the graph for the given key
 * @param {string} key The meta key for the value.
 * @param {Location} loc The location identifying the node.
 * @param {PortGraph} graph The graph.
 * @returns The value of the meta key of undefined if the key does not exist.
 */
export const getNodeMetaKey = curry((key, loc, graph) => {
  return getMetaKey(key, node(loc, graph))
})

/**
 * @function
 * @name setMeta
 * @description Set meta information in the graph
 * @param {Object} obj An object with all keys that shall be changed.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph with the applied changes.
 */
export const setMeta = curry((obj, graph) => {
  return changeSet.applyChangeSet(graph, changeSet.setMetaInformation(obj))
})

/**
 * @function
 * @name setNodeMeta
 * @description Set meta information for a node in the graph
 * @param {Object} obj An object with all keys that shall be changed.
 * @param {Location} loc The location identifying the node.
 * @param {PortGraph} graph The graph.
 * @returns {PortGraph} A new graph with the applied changes.
 */
export const setNodeMeta = curry((obj, loc, graph) => {
  return replaceNode(loc, setMeta(obj, node(loc, graph)), graph)
})
