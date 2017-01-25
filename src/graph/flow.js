
import flatten from 'lodash/fp/flatten'
import chunk from 'lodash/fp/chunk'
import snakeCase from 'lodash/fp/snakeCase'
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
        err.message += ' in flow function ' + (idx + 1) + ((fn.name && fn.name !== 'wrapper') ? ' named ' + fn.name : '') +
          ((fn.description) ? ' (Description: "' + fn.description + '")' : '')
        throw err
      }
    }, {graph, store: {}}).graph
  }
}

export const namedFlow = function () {
  var args = flatten(arguments)
  if (args.length % 2 !== 0) {
    throw new Error('Named flow must have an even number of arguments (and sub arguments) in the form [name, function, name function ...].')
  }
  return flow(chunk(2, args).map((named) => {
    var fn = new Function('return function ' + snakeCase(named[0]) + '(fn, ...args){ return fn.apply(this, args); }')().bind(undefined, named[1]) // eslint-disable-line no-new-func
    fn.description = named[0]
    return fn
  }))
}
