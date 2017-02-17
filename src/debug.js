/**
 * Utility methods to make it easier debugging graphs.
 */

import * as Format from './format'
import Debug from 'debug'

export function debug (graph, layer = false) {
  if (layer) {
    Debug('debug-graph')(Format.graphLayerToString(graph))
  } else {
    Debug('debug-graph')(Format.graphToString(graph))
  }
}
