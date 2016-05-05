
import _ from 'lodash'
import * as utils from './utils'
import * as walkNPG from './walkNetworkPortGraph'
import * as walkNG from './walkNetworkGraph'

var exports = ['successor', 'successorInPort', 'predecessor', 'predecessorOutPort',
  'walk', 'walkBack', 'adjacentNode', 'adjacentNodes']

export default _.fromPairs(_.map(exports, (e) => {
  // CAUTION: Do not use ES2015 notation for function. Accessing arguments does not work.
  return [e, function (graph) {
    return (utils.isNPG(graph))
      ? walkNPG[e].apply(null, arguments)
      : walkNG[e].apply(null, arguments)
  }]
}))
