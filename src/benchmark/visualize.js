// import * as Graph from '@buggyorg/graphtools'
// import jsdom from 'jsdom'
// import Plotly from './plotly-bundle.js'
import fs from 'fs'
import jsdom from 'jsdom/lib/old-api.js'

export function plotRuntime (data) {
  var graph

  jsdom.env(
    '<html><body></body></html>',
    ['http://d3js.org/d3.v3.min.js'],
    function (err, window) {
      if (err) throw err

      var graphDiv = window.document.getElementById('graph')
      var trace = [data]
      var Plotly = require('./plotly-bundle.js')
      Plotly.plot(graphDiv, trace)
      fs.writeFileSync('out.svg', window.d3.select('body').html())
      graph = window.d3.select('body').html()

      console.log('SVG: ')
      console.log(window.d3.select('body').html())
      fs.writeFileSync('out.svg', window.d3.select('body').html())
    }
  )

  return graph
}
