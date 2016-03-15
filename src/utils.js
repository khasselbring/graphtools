
import graphlib from 'graphlib'
import _ from 'lodash'

export function clone (graph) {
  if (typeof (graph.graph) === 'function') {
    return graphlib.json.read(graphlib.json.write(graph))
  } else {
    return _.clone(graph)
  }
}

export function edit (graph) {
  return graphlib.json.write(graph)
}

export function finalize (editGraph) {
  return graphlib.json.read(editGraph)
}

export function prefixName (prefix, name) {
  return `${prefix}:${name}`
}

export function prefixNode (prefix, node) {
  return _.merge({}, node, {v: prefixName(prefix, node.v)})
}
