/** @module ChangeSet */

/**
 * A change set contains information about how to transform a graph, e.g. insert an edge or modify a node.
 * @type ChangeSet
 */

import jq from 'json-query'
import _ from 'lodash'
import * as Node from './node'
import * as Edge from './edge'
import * as Component from './component'
import {isCompound} from './compound'

/**
 * Creates a change set to update a node with a given value
 * @param {string} node The identifier of the node.
 * @param {Object} mergeValue An object that contains parts of a node that should be set.
 * E.g. `{recursive: true}` will update the field `recursive` in the node and sets it to `true`.
 * @returns {ChangeSet} A change set containing the operation.
 */
export function updateNode (nodePath, mergeValue) {
  return {type: 'changeSet', operation: 'mergePath', query: nodePath, value: mergeValue}
}

/**
 * Creates a change set that creates a new node.
 * @param {Object} value The new node.
 * @returns {ChangeSet} A change set containing the new node.
 */
export function insertNode (value) {
  return {type: 'changeSet', operation: 'insert', query: 'nodes', value}
}

export function removeNode (id) {
  return {type: 'changeSet', operation: 'remove', query: 'nodes', filter: (n) => Node.equal(n, id)}
}

/**
 * Creates a change set that creates a new component.
 * @param {Object} value The new component.
 * @returns {ChangeSet} A change set containing the new component.
 */
export function insertComponent (value) {
  return {type: 'changeSet', operation: 'insert', query: 'components', value}
}

export function removeComponent (id) {
  return {type: 'changeSet', operation: 'remove', query: 'components', filter: (n) => Component.equal(n, id)}
}

export function addMetaInformation (key, value) {
  return {type: 'changeSet', operation: 'set', query: 'metaInformation', value: _.set({}, key, value)}
}

export function setMetaInformation (meta) {
  return {type: 'changeSet', operation: 'set', query: 'metaInformation', value: meta}
}

export function empty () {
  return {type: 'changeSet', opertaion: 'none'}
}

/**
 * Creates a change set that inserts a new edge into the edge list
 * @param {Object} newEdge The edge that should be inserted.
 * @returns {ChangeSet} A change set containing the insertion operation.
 */
export function insertEdge (newEdge) {
  return {type: 'changeSet', operation: 'insert', query: 'edges', value: newEdge}
}

/**
 * Creates a change set that removes the edge `edge`.
 * @param {Object} edge The edge to remove.
 * @returns {ChangeSet} The change set containing the deletion operation.
 */
export function removeEdge (edge) {
  return {type: 'changeSet', operation: 'remove', query: 'edges', filter: _.partial(Edge.equal, edge)}
}

/**
 * Creates a change set that adds edges to connect nodes in succession. All nodes, except the first and last, must be compound nodes.
 * @params {Object[]} stations The different nodes to connect in succession. Each object must contain a node property
 * and can contain a port property. E.g. `{node: 'a'}` org `{node: 'b', port: 'p'}`.
 * @returns {ChangeSet[]} An array of change sets that inserts the edges between the nodes. The change set will generate |stations| - 1 edges.
 */
export function createConnection (stations, extraValue = {}) {
  return _.reduce(stations, (acc, cur) => {
    if (!acc) {
      return {last: cur, edges: []}
    } else {
      var edgeCS = insertEdge({
        v: acc.last.node,
        w: cur.node,
        value: _.merge({outPort: acc.last.port, inPort: cur.port}, extraValue),
        name: acc.last.node + '@' + acc.last.port + '→' + cur.node + '@' + cur.port
      })
      return {last: cur, edges: _.concat(acc.edges, [edgeCS])}
    }
  }, null).edges
}

/**
 * Checks whether a value is a change set or not.
 * @param changeSet The value that should be checked.
 * @returns True if it is a changeSet, false otherwise.
 */
export function isChangeSet (changeSet) {
  return typeof (changeSet) === 'object' && changeSet.type === 'changeSet'
}

const applyMerge = (refs, mergeValue) => {
  _.each(refs, (r) => {
    _.mergeWith(r, mergeValue, (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue)
      }
    })
  })
}

const applyInsert = (refs, insertValue) => {
  _.each(refs, (r) => {
    if (!Array.isArray(r)) {
      throw new Error('Error while inserting, reference is no array' + JSON.stringify(r))
    }
    r.push(insertValue)
  })
}

const applyRemove = (refs, removeFilter) => {
  const findFunc = (typeof (removeFilter) === 'function')
    ? removeFilter
    : (r) => _.isEqual(r, removeFilter)

  _.each(refs, (ref) => {
    var idx = _.findIndex(ref, findFunc)
    if (idx > -1) {
      ref.splice(idx, 1)
    }
  })
}

const applySet = (refs, value) => {
  _.each(refs, (r) => _.merge(r, value))
}

const getReferences = (graph, changeSet) => {
  var refs = jq(changeSet.query, {data: graph})
  if (refs.length === 0) {
    throw new Error('Cannot ' + changeSet.operation + ' in ' + changeSet.query + ' the value: ' + JSON.stringify(changeSet.value))
  }
  return refs.references
}

const applyMergeByPath = (graph, path, value) => {
  var idx = _.findIndex(graph.nodes, Node.equal(path[0]))
  if (path.length === 1) {
    if (idx > -1) {
      return _.merge(graph.nodes[idx], value)
    }
  } else {
    if (idx > -1 && isCompound(graph.nodes[idx])) {
      applyMergeByPath(graph.nodes[idx], path.slice(1), value)
    }
  }
}

/**
 * Apply a changeSet on the given graph.
 * @param {Object} graph The graph in JSON format that should be changed.
 * @param {ChangeSet} changeSet The change set that should be applied.
 * @returns {Graphlib} A new graph with the applied change set graph.
 * @throws {Error} If the change set is no valid change set it throws an error.
 */
export function applyChangeSet (graph, changeSet) {
  var newGraph = _.cloneDeep(graph)
  return applyChangeSetInplace(newGraph, changeSet)
}

/**
 * Apply an array of changeSets on the given graph. All changes are applied sequentially.
 * @param {PortGraph} graph The graph that should be changed.
 * @param {ChangeSet[]} changeSets The change sets that should be applied. The order might influence the resulting graph, they are processesed sequentially.
 * @returns {Graphlib} A new graph with the applied change set graph.
 * @throws {Error} If the change set is no valid change set it throws an error.
 */
export function applyChangeSets (graph, changeSets) {
  var newGraph = _.clone(graph)
  _.each(changeSets, (c) => applyChangeSetInplace(newGraph, c))
  return newGraph
}

/**
 * Apply a changeSet on the given graph inplace.
 * @param {PortGraph} graph The graph that should be changed.
 * @param {ChangeSet} changeSet The change set that should be applied.
 * @returns {Graphlib} The changed graph. Currently the changes are all made inplace so the return value is equal to the input graph.
 * @throws {Error} If the change set is no valid change set it throws an error.
 */
export function applyChangeSetInplace (graph, changeSet) {
  if (!isChangeSet(changeSet)) {
    throw new Error('Cannot apply non-ChangeSet ' + JSON.stringify(changeSet))
  }
  if (changeSet.operation === 'mergePath') {
    applyMergeByPath(graph, changeSet.query, changeSet.value)
  }
  var refs = getReferences(graph, changeSet)
  switch (changeSet.operation) {
    case 'merge':
      applyMerge(refs, changeSet.value)
      break
    case 'insert':
      applyInsert(refs, changeSet.value)
      break
    case 'remove':
      applyRemove(refs, changeSet.filter)
      break
    case 'set':
      applySet(refs, changeSet.value)
      break
  }
  return graph
}
