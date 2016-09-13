
import {replaceNode} from './node'

/**
 * Sets the implementation of a node defined in a compound node to a new implementation.
 * @param {Compound} comp The compound node that should be changed.
 * @param {string|String[]} idOrPath The id of the node in the graph or a path object.
 * @param {Node} newNode The new node that updates the node with the given id.
 * @reutrns {Compound} The compound node with the updated node.
 */
export const replaceReference = replaceNode
