import find from 'lodash/fp/find'
import curry from 'lodash/fp/curry'
import omit from 'lodash/fp/omit'
import * as Component from '../component'
import * as changeSet from '../changeSet'
import {ConcreteNode} from '../node'
import {Portgraph} from './graph'
import {GraphAction} from './graphaction'
import {flowCallback} from './flow'

/**
 * Returns a list of defined components. Components are not part of the program flow, but are defined
 * procedures that can be used in the resolve process.
 * @param {PortGraph} graph The graph.
 * @returns {Components[]} A list of components that are defined in the graph.
 */
export function components (graph:Portgraph):Component.Component[] {
  return graph.components || []
}

/**
 * Returns a list of component ids. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @returns {string[]} A list of component ids.
 */
export function componentIds (graph:Portgraph) {
  return components(graph).map(Component.id)
}

/**
 * @description Returns the component with the given component id. [Performance O(|V|)]
 * @param {Component|string} comp The component or its component id.
 * @param {PortGraph} graph The graph.
 * @returns {Component} The component in the graph
 * @throws {Error} If the queried component does not exist in the graph.
 */
export function component (comp, graph:Portgraph):Component.Component {
  var res = find((c2) => Component.equal(comp, c2), components(graph))
  if (!res) {
    // TODO: debug(JSON.stringify(graph, null, 2)) // make printing the graph possible
    throw new Error(`Component with id '${comp}' does not exist in the graph.`)
  }
  return res
}

/**
 * @description Checks whether the graph has a component with the given component id. [Performance O(|V|)]
 * @param {PortGraph} graph The graph.
 * @param {Component|string} comp The component or its component id you want to check for.
 * @returns {boolean} True if the graph has a component with the given component id, false otherwise.
 */
export function hasComponent (comp, graph:Portgraph) {
  return !!find((c2) => Component.equal(comp, c2), components(graph))
}

function checkComponent (graph:Portgraph, comp) {
  if (!comp) {
    throw new Error('Cannot add undefined component to graph.')
  }
  /* else if (!Component.isValid(comp)) {
    throw new Error('Cannot add invalid component to graph. Are you missing the component-id, the version or a port?\nComponent: ' + JSON.stringify(comp))
  } */
  Component.assertValid(comp)
}

/**
 * @description Add a component to the graph. [Performance O(|V| + |E|)]
 * @param {Component} comp The component object that should be added.
 * @returns {GraphAction} The graph action that adds the component
 */
export function addComponent (comp):GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    if (hasComponent(comp, graph)) {
      throw new Error('Cannot add already existing component: ' + Component.id(comp))
    }
    checkComponent(graph, comp)
    return cb(comp, changeSet.applyChangeSet(graph, changeSet.insertComponent(comp)))
  }
}

/**
 * @description Removes a component from the graph. [Performance O(|V| + |E|)]
 * @param {Component|string} comp The component that shall be removed, either the component object or the component id.
 * @returns {GraphAction} The action that removes the component in a graph
 */
export function removeComponent (comp):GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    return cb(comp, changeSet.applyChangeSet(graph, changeSet.removeComponent(Component.id(comp))))
  }
}

/**
 * @description Update an existing component in the graph.
 * @param {Component|string} comp The component that will be update, either the component object or the component id.
 * @param {Object} merge Updated values of the component. It is not possible to change the component id with this method.
 * @param {PortGraph} graph The graph
 */
export function updateComponent (comp, merge):GraphAction {
  return (graph, ...cbs) => {
    const cb = flowCallback(cbs)
    if (!hasComponent(comp, graph)) {
      throw new Error('Cannot update non existing component: "' + Component.id(comp) + '"')
    }
    const newGraph = changeSet.applyChangeSet(graph,
      changeSet.updateComponent(Component.id(comp), omit('componentId', merge)))
    const upComp = component(comp, newGraph)
    return cb(upComp, newGraph)
  }
}

export function isomorphComponents (graph1:Portgraph, graph2:Portgraph) {
  const c1 = components(graph1)
  const c2 = components(graph2)
  if (c1.length !== c2.length) return false
  if (!components(graph1).every((c) => hasComponent(c, graph2))) return false
  if (!components(graph1).every((c) => Component.isomorph(c, component(c, graph2)))) return false
  return true
}
