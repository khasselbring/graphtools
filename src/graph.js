
import fs from 'fs'
import graphlib from 'graphlib'
import _ from 'lodash'

/**
 * Parses the pure JSON format to return a graphlib version of the graph.
 * @param {Object} json A JSON representation (e.g. created by toJSON) of a graph.
 * @returns {Graphlib} A graphlib graph of the editGraph
 */
export const importJSON = (json) => {
  return graphlib.json.read(json)
}

/**
 * Returns the pure JSON representation of the graph without all the graphlib features.
 * @param {Graphlib} graph The graph in graphlib format to convert
 * @returns {Object} A JSON representation of the graph.
 */
export const toJSON = (graph) => {
  // make sure all references are gone!
  return JSON.parse(JSON.stringify(graphlib.json.write(graph)))
}

/**
 * Parses a graphlib graph from the given string.
 * @param {string} graphStr The graph represented as a string
 * @returns {Graphlib} The graph in graphlib format
 */
export const readFromString = (graphStr) => {
  return importJSON(JSON.parse(graphStr))
}

/**
 * Reads a graph from a file
 * @param {string} file The filename to read.
 * @returns {Graphlib} The graph in graphlib format.
 */
export const readFromFile = (file) => {
  return readFromString(fs.readFileSync(file, 'utf8'))
}

/**
 * Reads a graph in JSON format from a file
 * @param {string} file The filename to read.
 * @returns {JSON} The graph in JSON format.
 */
export const jsonFromFile = (file) => {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/**
 * Compares two graphs for structural equality.
 * @param {Graphlib} graph1 One of the graphs to compare.
 * @param {Graphlib} graph2 The other the graph to compare.
 * @returns {boolean} True if both graphs are structually equal, false otherwise.
 */
export const equal = (graph1, graph2) => {
  return _.isEqual(toJSON(graph1), toJSON(graph2))
}

/**
 * Creates a new graph that has the exact same nodes and edges.
 * @param {Graphlib} graph The graph to clone
 * @returns {Graphlib} A clone of the input graph.
 */
export function clone (graph) {
  if (typeof (graph.graph) === 'function') {
    return graphlib.json.read(graphlib.json.write(graph))
  } else {
    return _.clone(graph)
  }
}
