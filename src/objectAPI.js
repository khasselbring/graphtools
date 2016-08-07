
import _ from 'lodash'

export function addObjectAPI (graph, apiMethods) {
  return _.reduce(apiMethods, (acc, method, name) => _.set(acc, name, _.partial(method, acc)), graph)
}

export function removeObjectAPI (graph, apiMethods) {
  return _.reduce(apiMethods, (acc, method, name) => _.set(acc, name, undefined), graph)
}
