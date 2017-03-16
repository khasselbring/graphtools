/**
 * Utility methods to make it easier debugging graphs.
 */

import * as Format from './format'
import Debug from 'debug'
import {Node} from './node'
import {Portgraph} from './graph/graph'

export function debug (graph:Node, layer = false):Node {
  if (layer === true) {
    Debug('debug-graph')(Format.graphLayerToString(graph))
  } else {
    Debug('debug-graph')(Format.graphToString(graph))
  }
  return graph
}
