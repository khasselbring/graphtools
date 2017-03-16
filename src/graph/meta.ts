
import * as changeSet from '../changeSet'
import curry from 'lodash/fp/curry'
import {Node} from '../node'
import {GraphAction} from './graphaction'
import {flowCallback} from './flow'

/**
 * Returns the meta information encoded in the graph
 * @param {Node} graph The graph.
 * @returns {object} An object with all meta information keys.
 */
export function meta (graph:Node) {
  return graph.metaInformation
}

/**
 * @description Sets the meta information in the graph for the given key to the value
 * @param {string} key The meta key for the value.
 * @param value Any possible value for the key.
 * @returns {GraphAction} The action that updates the graph
 */
export function setMetaKey (key, value):GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    return cb(value, changeSet.applyChangeSet(graph, changeSet.addMetaInformation(key, value)))
  }
}

/**
 * @description Set meta information in the graph
 * @param {Object} obj An object with all keys that shall be changed.
 * @returns {GraphAction} The action that updates the graph
 */
export function setMeta (obj):GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    return cb(obj, changeSet.applyChangeSet(graph, changeSet.setMetaInformation(obj)))
  }
}
