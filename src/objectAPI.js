
import _ from 'lodash'

export function addObjectAPI (graph, apiMethods) {
  return _.reduce(apiMethods, (acc, method, name) => _.set(acc, name, _.partial(method, acc)), graph)
}

function deleteKey (obj, key) {
  delete obj[key]
  return obj
}

export function removeObjectAPI (graph, apiMethods) {
  return _.reduce(apiMethods, (acc, method, name) => deleteKey(acc, name), graph)
}
