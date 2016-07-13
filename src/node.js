
/**
 * Returns the unique identifier of a node
 * @params {Node} node The node
 * @returns {string} The unique identifier of the node
 */
export function id (node) {
  if (typeof (node) === 'string') {
    return node
  }
  return node.id
}
