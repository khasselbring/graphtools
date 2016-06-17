
/**
 * A change set contains information about how to transform a graph, e.g. insert an edge or modify a node.
 * @type ChangeSet
 */

import jq from 'json-query'
import _ from 'lodash'

/**
 * Creates a change set to update a node with a given value
 * @param {string} node The identifier of the node.
 * @param {Object} mergeValue An object that contains parts of a node that should be set.
 * E.g. `{recursive: true}` will update the field `recursive` in the node and sets it to `true`.
 * @returns {ChangeSet} A change set containing the operation.
 */
export function updateNode (node, mergeValue) {
  return {type: 'changeSet', operation: 'merge', query: 'nodes[v=' + node + '].value', value: mergeValue}
}

/**
 * Creates a change set that inserts a new edge into the edge list
 * @param {Object} newEdge The edge that should be inserted.
 * @returns {ChangeSet} A change set containing the insertion operation.
 */
export function insertEdge (newEdge) {
  return {type: 'changeSet', operation: 'insert', query: 'edges', value: newEdge}
}

export function removeEdge (edge) {
  return {type: 'changeSet', operation: 'remove', query: 'edges', filter: edge}
}

export function createConnection (stations) {
  return _.reduce(stations, (acc, cur) => {
    if (!acc) {
      return {last: cur, edges: []}
    } else {
      var edgeCS = insertEdge({v: acc.last.node, w: cur.node, value: {outPort: acc.last.port, inPort: cur.port}})
      return {last: cur, edges: _.concat(acc.edges, [edgeCS])}
    }
  }).edges
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
    _.merge(r, mergeValue)
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
  refs = _.reject(refs, (r) => _.isEqual(r, removeFilter))
}

const getReferences = (graph, changeSet) => {
  var refs = jq(changeSet.query, {data: graph})
  if (refs.length === 0) {
    throw new Error('Cannot ' + changeSet.operation + ' in ' + changeSet.query + ' the value: ' + JSON.stringify(changeSet.value))
  }
  return refs.references
}

/**
 * Apply a changeSet on the given graph
 * @param {Object} graph The graph in JSON format that should be changed.
 * @param {ChangeSet} changeSet The change set that should be applied.
 * @returns {Graphlib} The changed graph. Currently the changes are all made inplace so the return value is equal to the input graph.
 * @throws {Error} If the change set is no valid change set it throws an error.
 */
export function applyChangeSet (graph, changeSet) {
  if (!isChangeSet(changeSet)) {
    throw new Error('Cannot apply non-ChangeSet ' + JSON.stringify(changeSet))
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
  }
  return graph
}
