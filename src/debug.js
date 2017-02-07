/**
 * Utility methods to make it easier debugging graphs.
 */

import fs from 'fs'
import * as Format from './format'

export function debug (graph) {
  var stream3 = fs.createWriteStream(null, {fd: 3})
  stream3.on('error', () => null)
  if (!stream3.closed) {
    stream3.write(Format.graphLayerToString(graph))
  }
}
