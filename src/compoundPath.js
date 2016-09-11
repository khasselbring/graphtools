/** @module CompoundPath
 * A compound path is a unique representation of a node in the graph. It is defined as an array of
 * parent nodes starting at the root level, e.g. `['A', 'B', 'C']` points to the node `C` whose parent
 * is `B` and the parent of `B` is `A`. All methods accept the array notation or the shorthand string
 * notation. The shorthand string notation starts with a `»` (ALT-GR+Y) and separates each node with
 * a `»`, e.g. `»A»B»C` describes the exact same path as above. For elements on the root level it is
 * okay to omit the `»`, i.e. `»A` is the same as `A`.
 */

import _ from 'lodash'

/**
 * Converts a compound path into its string representation. The seperate parts are divided by a '»'.
 * @param {String[]} compoundPathArr An array of node IDs reperesenting the compound path.
 * @returns {String} The string representation of the compound path.
 */
export function toString (compoundPathArr) {
  if (compoundPathArr.length === 1) return compoundPathArr[0]
  return compoundPathArr.reduce((acc, n) => acc + '»' + n, '')
}

/**
 * Converts a compound path string into its array representation. The seperate parts must be divided by a '»'.
 * @param {String} compoundPathStr A string reperesenting the compound path divded by '»'.
 * @returns {String[]} An array of node IDs representing the compound path.
 */
export function fromString (compoundPathStr) {
  if (compoundPathStr.indexOf('»') === -1) return [compoundPathStr]
  return compoundPathStr.split('»').slice(1)
}

/**
 * Returns whether a string represents a compound path or not.
 * @param {string} path The path string to test.
 * @returns True if the path represents a compound path, false otherwise.
 */
export function isCompoundPath (path) {
  return typeof (path) === 'string' && path[0] === '»'
}

/**
 * Convert a path representation into its normalized array form.
 * @param {string|string[]} path The path as a string or array.
 * @returns {Path} The normalized path.
 */
export function normalize (path) {
  if (Array.isArray(path)) {
    return _.compact(path)
  } else {
    return _.compact(fromString(path))
  }
}

/**
 * Joins two paths into one.
 * @param {Path} base The prefix of the new path
 * @param {Path} rest The postfix of the new path.
 * @returns {Path} The new path in the form `<base>»<rest>`.
 */
export function join (base, rest) {
  if (!base) return rest
  return _.concat(normalize(base), normalize(rest))
}

/**
 * Returns whether a path points to the root element or not.
 * @param {Path} path The path to check
 * @returns {boolean} True if the path points to the root element ('', '»' or []), false otherwise.
 */
export function isRoot (path) {
  if (typeof (path) === 'string') {
    if (path === '') return true
    path = fromString(path)
  }
  return path.length === 0
}

/**
 * Returns the parent of a compound path.
 * @param {string[]|string} path The path either as a string or an array.
 * @returns {string[]|string} The parent of the path in the same format as the input.
 * @throws {Error} If the input format is invalid.
 */
export function parent (path) {
  if (typeof (path) === 'string') {
    return toString(parent(fromString(path)))
  } else if (Array.isArray(path)) {
    return path.slice(0, -1)
  } else {
    throw new Error('Malformed compound path. It must either be a string or an array of node IDs. Compounds paths was: ' + JSON.stringify(path))
  }
}

export function node (path) {
  if (typeof (path) === 'string') {
    return toString(node(fromString(path)))
  } else if (Array.isArray(path)) {
    return path.slice(-1)
  } else {
    throw new Error('Malformed compound path. It must either be a string or an array of node IDs. Compounds paths was: ' + JSON.stringify(path))
  }
}

/**
 * Returns whether two compound paths are equal
 * @param {CompoundPath} path1 The first path to compare.
 * @param {CompoundPath} path2 The second path to compare.
 * @returns {boolean} True if the paths are the same, false otherwise.
 */
export function equal (path1, path2) {
  return _.isEqual(path1, path2)
}

export function sameParents (path1, path2) {
  return path1 && path2 && path1.length > 0 && path2.length > 0 && equal(parent(path1), parent(path2))
}
