var jsdom = require('jsdom/lib/old-api.js').jsdom
global.document = jsdom('<!doctype html><html><body><div class="ct-chart ct-perfect-fourth"></div></body></html>')
global.window = document.defaultView
global.navigator = global.window.navigator
global.HTMLElement = global.window.HTMLElement
global.DOMParser = global.window.DOMParser
global.HTMLCanvasElement = global.window.HTMLCanvasElement
global.CanvasRenderingContext2D = global.window.CanvasRenderingContext2D

var Chartist = require('chartist')
var graph = document.getElementById("graph")
var data = {
  // A labels array that can contain any sort of values
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  // Our series array that contains series objects or in this case series data arrays
  series: [
    [5, 2, 4, 2, 0]
  ]
};

// Create a new line chart object where as first parameter we pass in a selector
// that is resolving to our chart container element. The Second parameter
// is the actual data object.
Chartist.Line('.ct-chart', data)
