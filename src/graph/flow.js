
import flatten from 'lodash/fp/flatten'
import chunk from 'lodash/fp/chunk'
import {empty} from './basic'
import {debug} from '../debug'

function functionName (fn, options, idx) {
  if (options && options.names && options.names[idx]) return options.names[idx]
  if (fn.name && fn.name !== 'wrapper') return fn.name
}

function functionDescription (fn, options, idx) {
  if (options && options.descriptions && options.descriptions[idx]) return options.descriptions[idx]
  if (fn.description) return fn.description
}

function isOptionsObj (arg) {
  return !Array.isArray(arg) && typeof (arg) === 'object'
}

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
  var lastArg = args[args.length - 1]
  var options
  if (isOptionsObj(lastArg)) {
    options = lastArg
    args = args.slice(0, -1)
  }
  return (graph) => {
    if (!graph) {
      graph = empty()
    }
    return [].reduce.call(args, (obj, fn, idx) => {
      try {
        var newGraph = fn(obj.graph, (data, graph) => graph)
        if (options && options.debug) debug(newGraph)
        return {graph: newGraph, store: obj.store}
      } catch (err) {
        var flowName = options && options.name
        var fnName = functionName(fn, options, idx)
        var fnDesc = functionDescription(fn, options, idx)
        err.message += ' in flow function ' + ((flowName) ? '"' + flowName + '"' : '') + ' (at position: ' + (idx + 1) + ')' +
          ((fnName) ? ' named ' + fnName : '') +
          ((fnDesc) ? ' (Description: "' + fnDesc + '")' : '')
        throw err
      }
    }, {graph, store: {}}).graph
  }
}

export const letFlow = (fn, cb) => {
  return (graph) => {
    if (Array.isArray(fn)) {
      var res = []
      const arrCb = (idx) => (data, cbGraph) => {
        res[idx] = data
        return cbGraph
      }
      var resGraph = fn.reduce((gr, f, idx) => f(gr, arrCb(idx)), graph)
      return cb(res, resGraph)
    }
    return fn(graph, cb)
  }
}

export const flowCallback = (cbs) => {
  if (Array.isArray(cbs) && typeof (cbs[0]) === 'function') {
    return cbs[0]
  } else if (typeof (cbs) === 'function') {
    return cbs
  }
  return (_, graph) => graph
}

export const debugFlow = function () {
  var lastArg = arguments[arguments.length - 1]
  if (isOptionsObj(lastArg)) {
    return flow(...arguments.slice(0, -1), Object.assign(lastArg, {debug: true}))
  }
  return flow(...arguments, {debug: true})
}

export const namedFlow = function () {
  var lastArg = arguments[arguments.length - 1]
  var args = arguments
  var options = {}
  if (isOptionsObj(lastArg)) {
    options = lastArg
    args = args.slice(0, -1)
  }
  if (args.length % 2 !== 0) {
    throw new Error('Named flow must have an even number of arguments (and sub arguments) in the form [name, function, name function ...].')
  }
  const names = chunk(2, args).map((named) => named[0])
  const fns = chunk(2, args).map((named) => named[1])
  return flow(fns, Object.assign(options, {names}))
}
