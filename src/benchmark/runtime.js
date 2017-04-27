/**
 * Creates a function that runs f n times with the initial argument
 * @param {integer} n repetitions
 * @param {function} f function to run
 */
export function times (n, f) {
  return function () {
    for (var i = 0; i < n; i++) {
      f(arguments)
    }
  }
}

/**
 * Creates a functions that runs f n times each time passing the result back into the function
 * @param {integer} n repetitions
 * @param {function} f function to run
 */
export function timesIntermediate (n, f) {
  return function (x) {
    for (var i = 0; i < n; i++) {
      x = f(x)
    }
    return x
  }
}

/**
 * Checks whether values a and b differ by a maximum of epsilon percent of the higher of both values
 * @param {number} a first value
 * @param {number} b second value
 * @param {number} epsilon maximum differal percentage
 */
export function inEpsilonRange (a, b, epsilon) {
  return Math.abs(a - b) <= epsilon * Math.max(a, b) * 0.01
}

/**
 * TODO
 * @param {number[]} values
 * @param {string} behavior
 */
export function hasGrowthBehavior (values, behavior, epsilon) {
  var f
  switch (behavior) {
    case 'linear':
      f = function (last, next) {
        return next - last
      }
      break
    case 'exponential':
      f = function (last, next) {
        return next / last
      }
      break
    default:
      f = function (last, next) {
        return 0
      }
  }
  return growsByFunction(values, f, epsilon)
}

/**
 * Checks whether all values grow in a given behavior.
 * The behavior function receives two consecutive values and normalizes them
 * @param {*} values the values to check
 * @param {*} f the growth function
 * @param {*} epsilon a maximum differal between observed and expected results
 */
export function growsByFunction (values, f, epsilon) {
  var last = f(values[0], values[1])
  for (var i = 2; i < values.length; i++) {
    var next = f(values[i - 1], values[i])
    if (!inEpsilonRange(next, last, epsilon)) return false
    last = next
  }
  return true
}

/**
 * Runs a function and measures the time needed to do so
 * The returned Object has the output of the function and its runtime stored
 * @param {function} f The function to run
 * @returns {milliseconds} The time used by the function
 */
export function executionTime (f) {
  var results = {}
  var before = new Date()
  results.output = f()
  var after = new Date()
  results.runtime = after - before
  return results
}
