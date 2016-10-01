import find from 'lodash/fp/find'
import curry from 'lodash/fp/curry'
import * as Component from '../component'
import * as changeSet from '../changeSet'

/**
 * Returns a list of defined components. Components are not part of the program flow, but are defined
 * procedures that can be used in the resolve process.
 * @param {PortGraph} graph The graph.
 * @retuns {Components[]} A list of components that are defined in the graph.
 */
export function components (graph) {
  return graph.components
}

/**
 * Returns a list of component ids. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of component ids.
 */
export function componentIds (graph) {
  return graph.components.map(Component.componentId)
}

/**
 * @function
 * @name component
 * @description Returns the component with the given component id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Component|string} comp The component or its component id.
 * @returns {Component} The component in the graph
 * @throws {Error} If the queried component does not exist in the graph.
 */
export const component = curry((comp, graph) => {
  var res = find(Component.equal(comp), graph.components)
  if (!res) {
    // TODO: debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    throw new Error(`Component with id '${comp}' does not exist in the graph.`)
  }
  return res
})

/**
 * @function
 * @name hasComponent
 * @description Checks whether the graph has a component with the given component id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Component|string} comp The component or its component id you want to check for.
 * @returns {boolean} True if the graph has a component with the given component id, false otherwise.
 */
export const hasComponent = curry((comp, graph) => {
  return !!find(Component.equal(comp), graph.components)
})

function checkComponent (graph, comp) {
  if (!comp) {
    throw new Error('Cannot add undefined component to graph.')
  } else if (!Component.isValid(comp)) {
    throw new Error('Cannot add invalid component to graph. Are you missing the component-id, the version or a port?\nComponent: ' + JSON.stringify(comp))
  }
}

/**
 * @function
 * @name addComponent
 * @description Add a component to the graph. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {Component} comp The component object that should be added.
 * @returns {PortGraph} A new graph that includes the component.
 */
export const addComponent = curry((comp, graph) => {
  if (hasComponent(comp, graph)) {
    throw new Error('Cannot add already existing component: ' + Component.id(comp))
  }
  checkComponent(graph, comp)
  return changeSet.applyChangeSet(graph, changeSet.insertComponent(comp))
})

/**
 * @function
 * @name removeComponent
 * @description Removes a component from the graph. [Performance O(|V| + |E|)]
 * @param {PortGraph} graph The graph.
 * @param {Component|string} comp The component that shall be removed, either the component object or the component id.
 * @returns {PortGraph} A new graph without the given component.
 */
export const removeComponent = curry((comp, graph) => {
  return changeSet.applyChangeSet(graph, changeSet.removeComponent(Component.id(comp)))
})
