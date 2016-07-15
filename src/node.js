
/**
 * A node either as an identifier, or as an object containing the property `node` as its identifier.
 * @typedef {(string|Object)} Node
 */

/**
 * Returns the unique identifier of a node
 * @params {Node} node The node
 * @returns {string} The unique identifier of the node
 * @throws {Error} If the node value is invalid.
 */
export function id (node) {
  if (typeof (node) === 'string') {
    return node
  } else if (node == null) {
    throw new Error('Cannot determine id of undefined node.')
  } else if (!node.id) {
    throw new Error('Malformed node. The node must either be a string that represents the id. Or it must be an object with an id field.\n Node: ' + JSON.stringify(node))
  }
  return node.id
}

/**
 * Tests whether two nodes are the same node. This tests only if their IDs are
 * the same not if both nodes contain the same information.
 * @param {Node} node1 One of the nodes to test.
 * @param {Node} node2 The other one.
 * @returns {boolean} True if they have the same id, false otherwise.
 */
export function equal (node1, node2) {
  return id(node1) === id(node2)
}
