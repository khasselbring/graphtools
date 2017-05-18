/**
 * Runs a benchmark function with multiple arguments, each repetition varying one argument x
 * @param {function} func A benchmark function to run with various arguments
 * @param {string} logfile A filename of the file to store the results in
 * @param {string} header The column header to explain what x does
 * @param {number} variant The index of x, the only value that is changed between repetitions
 * @param {array} argsList An array of argument-arrays where the argument at position variant gets replaced
 */
export function benchmark (func, logfile, header, variant, argsList) {
  var csvWriter = require('csv-write-stream')
  var fs = require('fs')
  var writer = csvWriter({ headers: [header, 'runtime[ms]', 'ms / x'] })
  var mkdirp = require('mkdirp')
  mkdirp('./benchmarkLogs/')
  writer.pipe(fs.createWriteStream('./benchmarkLogs/' + logfile))
  for (var ind in argsList) {
    var runtime = func.apply(func, argsList[ind])
    var x = argsList[ind][variant]
    writer.write([x, runtime, runtime / x])
  }
  writer.end()
}

/**
 * @param {function} func A benchmark function to run with various arguments
 * @param {string} logfile A filename of the file to store the results in
 * @param {string} header The column header to explain what x does
 * @param {number} variant The index of the only value that is changed between repetitions
 * @param {number} from The first value to run the benchmark with
 * @param {number} to The last value to run the benchmark with
 * @param {number} steps The amount of steps including the first and last
 */
export function benchmarkRange (func, logfile, header, args, variant, from, to, steps) {
  var argsList = []
  for (var i = from; i <= to; i += (to - from) / steps) {
    args.splice(variant, 1, Math.floor(i))
    argsList.push(args.slice() /* copy array */)
  }
  benchmark(func, logfile, header, variant, argsList)
}
