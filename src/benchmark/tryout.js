// Run some jQuery on a html fragment
var jsdom = require('jsdom/lib/old-api.js')

jsdom.env(
  '<html><body><div id="graph"></div></body></html>',
  ['http://code.jquery.com/jquery.js'],
  function (err, window) {
    if (err) throw err
    var graphDiv = window.$('#graph')
    const data = {
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16]
    }
    var trace = [data]
    var Plotly = require('./plotly-bundle.js')
    Plotly.plot(graphDiv, trace)
    console.log('contents of a.the-link:', window.$('a.the-link').text())
  }
);