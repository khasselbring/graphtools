
import flatten from 'lodash/fp/flatten'
import {empty} from './basic'

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
