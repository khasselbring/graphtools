/**
 * This file contains all the input / output methods for graphs
 */

import graphlib from 'graphlib'
import fs from 'fs'

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
  if (typeof (graph.nodes) === 'function') {
    return JSON.parse(JSON.stringify(graphlib.json.write(graph)))
  } else {
    return graph
  }
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
