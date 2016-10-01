
import flatten from 'lodash/fp/flatten'
import {empty} from './basic'

/**
 * @function
 * @name flow
 * @param {Function|Array} ...args An arbitrary number of arguments of that are either functions that
 * take one argument and return this argument. Or an array of functions that each take an argument and
 * return one. The functions must be composable.
 * @returns {Function} A function that takes an object that is fed into the first function in the arguments.
 */
export const flow = function () {
  var args = flatten(arguments)
  return (graph) => {
    if (!graph) {
      graph = empty()
    }
    return [].reduce.call(args, (obj, fn, idx) => {
      try {
        var newGraph = fn(obj.graph, (data) => {
          obj.store[idx] = data
          return obj.store
        })
        return {graph: newGraph, store: obj.store}
      } catch (err) {
        err.message += ' in flow function ' + (idx + 1) + ((fn.name && fn.name !== 'wrapper') ? ' named ' + fn.name : '')
        throw err
      }
    }, {graph, store: {}}).graph
  }
}
