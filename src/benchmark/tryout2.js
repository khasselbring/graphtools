var jsdom = require('jsdom/lib/old-api.js').jsdom
document = jsdom('<html><body><div id="graph"></div></body></html>')
window = document.defaultView

var graphDiv = document.getElementById('graph')
const data = {
  x: [1, 2, 3, 4, 5],
  y: [1, 2, 4, 8, 16]
}
var trace = [data]
var Plotly = require('./plotly-bundle.js')
Plotly.plot(graphDiv, trace)
